import "dotenv/config";
import fs from "fs";
import util from "util";
import db from "./db";
import { sql } from "kysely";
import ytdl from "@distube/ytdl-core";
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import crypto from "crypto";

const PROXY_USERNAME = process.env.PROXY_USERNAME;
const PROXY_PASSWORD = process.env.PROXY_PASSWORD;
const PROXY_COUNTRY = process.env.PROXY_COUNTRY;
const PROXY_HOST = process.env.PROXY_HOST;

const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set in environment variables"
  );
}
const s3 = new S3({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: process.env.S3_BUCKET_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

if (!fs.existsSync("logsinks")) {
  fs.mkdirSync("logsinks");
}
const logStream = fs.createWriteStream("logsinks/worker-logsink.log", {
  flags: "a",
});
const origLog = console.log;
const origErr = console.error;
console.log = (...args: unknown[]) => {
  logStream.write(util.format(...args) + "\n");
  origLog(...args);
};
console.error = (...args: unknown[]) => {
  logStream.write(util.format(...args) + "\n");
  origErr(...args);
};

// Atomically get and claim a song for processing in a single transaction
async function getAndClaimNextSong() {
  return await db.transaction().execute(async (trx) => {
    // Find a song with a youtube_id that does NOT have an song_youtube_status with status in (processing, completed, failed)
    const song = await trx
      .selectFrom("songs")
      .select(["id", "youtube_id"])
      .where("youtube_id", "is not", null)
      .where(
        ({ ref }) =>
          sql`
        (
          NOT EXISTS (
            SELECT 1 FROM song_youtube_status 
            WHERE song_youtube_status.youtube_id = ${ref("songs.youtube_id")}
          )
          OR
          NOT EXISTS (
            SELECT 1 FROM song_youtube_status 
            WHERE song_youtube_status.youtube_id = ${ref("songs.youtube_id")}
            AND song_youtube_status.status IN ('processing', 'completed', 'failed')
          )
        )
        `
      )
      .distinct()
      .limit(1)
      .executeTakeFirst();
    if (!song || !song.youtube_id) return null;
    // Try to update a pending record to processing
    const updated = await trx
      .updateTable("song_youtube_status")
      .set({ status: "processing", updated_at: new Date().toISOString() })
      .where("youtube_id", "=", song.youtube_id)
      .where("status", "=", "pending")
      .executeTakeFirst();
    if (updated && updated.numUpdatedRows > 0) {
      return song;
    }
    // Otherwise, insert a new processing record
    await trx
      .insertInto("song_youtube_status")
      .values({
        id: crypto.randomUUID(),
        youtube_id: song.youtube_id,
        status: "processing",
        retry_count: 0,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();
    return song;
  });
}

async function getRetryCount(youtube_id: string) {
  const statusRow = await db
    .selectFrom("song_youtube_status")
    .select(["retry_count"])
    .where("youtube_id", "=", youtube_id)
    .where("status", "=", "processing")
    .executeTakeFirst();
  return statusRow?.retry_count ?? 0;
}

function getTimeoutMs(retryCount: number) {
  if (retryCount < 5) return 60 * 1000;
  if (retryCount < 7) return 2 * 60 * 1000;
  if (retryCount < 10) return 3 * 60 * 1000;
  return 10 * 60 * 1000;
}

async function workerLoop() {
  while (true) {
    try {
      const song = await getAndClaimNextSong();
      if (!song) {
        await new Promise((res) => setTimeout(res, 5000));
        continue;
      }
      const youtube_id = song.youtube_id;
      if (!youtube_id) continue;
      console.log(
        `Claimed and processing song with youtube_id: ${youtube_id}`,
        new Date().toISOString()
      );
      try {
        const retryCount = await getRetryCount(youtube_id);
        console.log(
          `Processing ${youtube_id} with retry count ${retryCount}`,
          new Date().toISOString()
        );
        const timeoutMs = getTimeoutMs(retryCount);

        await (async () => {
          const abortController = new AbortController();
          let timeoutId: NodeJS.Timeout | undefined;
          try {
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => {
                abortController.abort();
                reject(new Error("Processing timed out"));
              }, timeoutMs);
            });

            const ytdlAgent = PROXY_HOST
              ? ytdl.createProxyAgent({
                  uri: `http://${PROXY_USERNAME}${
                    PROXY_COUNTRY ? `-cc-${PROXY_COUNTRY}` : ""
                  }:${PROXY_PASSWORD}@${PROXY_HOST}`,
                })
              : undefined;
            const info = await ytdl.getInfo(youtube_id, { agent: ytdlAgent });
            const format = ytdl.chooseFormat(info.formats, {
              quality: "highestaudio",
              filter: "audioonly",
            });
            if (!format || !format.mimeType) {
              throw new Error("No suitable audio format found");
            }
            const { PassThrough } = await import("stream");
            const s3Key = `youtube-audio/${youtube_id}.webm`;
            await Promise.race([
              new Promise((resolve, reject) => {
                const stream = ytdl(youtube_id, {
                  quality: "highestaudio",
                  filter: "audioonly",
                  agent: ytdlAgent,
                });
                abortController.signal.addEventListener("abort", () => {
                  stream.destroy(new Error("Aborted by timeout"));
                });
                stream.on("error", (err) => {
                  if (abortController.signal.aborted) {
                    reject(new Error("Aborted by timeout"));
                  } else {
                    console.error(`Stream error for ${youtube_id}:`, err);
                    reject(err);
                  }
                });
                const pass = new PassThrough();
                stream.pipe(pass);
                const upload = new Upload({
                  client: s3,
                  params: {
                    Bucket: S3_BUCKET_NAME!,
                    Key: s3Key,
                    Body: pass,
                    ContentType: "audio/webm",
                    ACL: "public-read",
                  },
                });
                abortController.signal.addEventListener("abort", () => {
                  pass.destroy(new Error("Aborted by timeout"));
                });
                upload
                  .done()
                  .then(() => resolve(undefined))
                  .catch((err) => {
                    if (abortController.signal.aborted) {
                      reject(new Error("Aborted by timeout"));
                    } else {
                      console.error(`S3 upload error for ${youtube_id}:`, err);
                      reject(err);
                    }
                  });
              }),
              timeoutPromise,
            ]);
            // Mark as completed
            await db
              .updateTable("song_youtube_status")
              .set({
                status: "completed",
                updated_at: new Date().toISOString(),
                error_message: null,
              })
              .where("youtube_id", "=", youtube_id)
              .where("status", "=", "processing")
              .execute();
            console.log(`Uploaded ${youtube_id} to S3 as ${s3Key}`);
            return;
          } catch (err) {
            throw err;
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
          }
        })();
      } catch (err: any) {
        console.error("Download/upload error for", youtube_id, err);
        const statusRow = await db
          .selectFrom("song_youtube_status")
          .select(["retry_count"])
          .where("youtube_id", "=", youtube_id)
          .where("status", "=", "processing")
          .executeTakeFirst();
        const currentRetry = statusRow?.retry_count ?? 0;
        if (currentRetry < 10) {
          await db
            .updateTable("song_youtube_status")
            .set({
              status: "pending",
              retry_count: currentRetry + 1,
              updated_at: new Date().toISOString(),
              error_message: err?.message?.toString() || String(err),
            })
            .where("youtube_id", "=", youtube_id)
            .where("status", "=", "processing")
            .execute();
        } else {
          await db
            .updateTable("song_youtube_status")
            .set({
              status: "failed",
              updated_at: new Date().toISOString(),
              error_message: err?.message?.toString() || String(err),
            })
            .where("youtube_id", "=", youtube_id)
            .where("status", "=", "processing")
            .execute();
        }
      }
    } catch (err) {
      console.error("Worker loop error:", err);
      await new Promise((res) => setTimeout(res, 5000));
    }

    await new Promise((res) => setTimeout(res, 1000));
  }
}

workerLoop();
