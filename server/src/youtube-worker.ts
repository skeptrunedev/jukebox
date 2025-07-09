import "dotenv/config";
import fs from "fs";
import util from "util";
import db from "./db";
import { sql } from "kysely";
import ytdl from "@distube/ytdl-core";
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import crypto from "crypto";
import http from "http";
import nodemailer from "nodemailer";
// SMTP email sender setup
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === "true", // true for SSL/TLS, false for STARTTLS or plain
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;

export async function sendFailureEmail(youtube_id: string, err: any) {
  if (!SMTP_FROM_EMAIL) return;
  const mailOptions = {
    from: SMTP_FROM_EMAIL,
    to: SMTP_FROM_EMAIL, // send to self; customize as needed
    subject: `🚨🚨 Jukebox: Song upload failed for YouTube ID ${youtube_id} 🚨🚨`,
    text: `🚨 Song upload failed for YouTube ID: ${youtube_id}\n\nError 🚨: ${
      err?.message || err
    }`,
  };
  try {
    await smtpTransport.sendMail(mailOptions);
    console.log(`Failure email sent for ${youtube_id}`);
  } catch (emailErr) {
    console.error("Failed to send failure email:", emailErr);
  }
}

export async function sendSuccessEmail(youtube_id: string) {
  if (!SMTP_FROM_EMAIL) return;
  const mailOptions = {
    from: SMTP_FROM_EMAIL,
    to: SMTP_FROM_EMAIL, // send to self; customize as needed
    subject: `✅✅ Jukebox: Song upload succeeded for YouTube ID ${youtube_id} ✅✅`,
    text: `✅ Song upload succeeded for YouTube ID: ${youtube_id} ✅`,
  };
  try {
    await smtpTransport.sendMail(mailOptions);
    console.log(`Success email sent for ${youtube_id}`);
  } catch (emailErr) {
    console.error("Failed to send success email:", emailErr);
  }
}

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

// Exit the process on unhandled errors so healthcheck server also stops
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Graceful shutdown handler to reset processing records
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Resetting processing records to pending...`);
  try {
    // Reset any records that are currently being processed back to pending
    const result = await db
      .updateTable("song_youtube_status")
      .set({
        status: "pending",
        updated_at: new Date().toISOString(),
        error_message: "Worker process was terminated, resetting to pending",
      })
      .where("status", "=", "processing")
      .execute();

    const resetCount = result.reduce(
      (sum, r) => sum + Number(r.numUpdatedRows || 0),
      0
    );
    console.log(`Reset ${resetCount} processing records to pending`);
  } catch (err) {
    console.error("Error during graceful shutdown:", err);
  } finally {
    process.exit(0);
  }
}

// Register shutdown handlers for common termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

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

async function workerLoop() {
  while (true) {
    // Uncomment the next line to force an error and test failure emails
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

        await (async () => {
          const abortController = new AbortController();
          let timeoutId: NodeJS.Timeout | undefined;
          try {
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
            let chunkCountReceived = 0;
            const { PassThrough } = await import("stream");
            const s3Key = `youtube-audio/${youtube_id}.webm`;
            // Await the upload promise so logs and DB update happen after upload completes
            const uploadPromise = new Promise((resolve, reject) => {
              const stream = ytdl(youtube_id, {
                quality: "highestaudio",
                filter: "audioonly",
                agent: ytdlAgent,
              });
              let inactivityTimeout: NodeJS.Timeout | undefined;
              let startTimeout: NodeJS.Timeout | undefined;
              let receivedFirstData = false;
              const resetInactivityTimeout = () => {
                if (inactivityTimeout) clearTimeout(inactivityTimeout);
                inactivityTimeout = setTimeout(() => {
                  stream.destroy(
                    new Error("Aborted by inactivity timeout (no data for 15s)")
                  );
                }, 15000);
              };
              // Start the inactivity timer
              resetInactivityTimeout();
              // Start the start timeout (fires if no data received in 15s)
              startTimeout = setTimeout(() => {
                if (!receivedFirstData) {
                  stream.destroy(
                    new Error(
                      "Aborted by start timeout (no data received in first 15s)"
                    )
                  );
                }
              }, 15000);
              stream.on("data", (chunk) => {
                if (!receivedFirstData) {
                  receivedFirstData = true;
                  if (startTimeout) clearTimeout(startTimeout);
                }
                resetInactivityTimeout();
                chunkCountReceived += 1;
                console.log(
                  `Stream received data for ${youtube_id}: ${chunk.length} bytes (chunk #${chunkCountReceived})`
                );
              });
              abortController.signal.addEventListener("abort", () => {
                if (inactivityTimeout) clearTimeout(inactivityTimeout);
                if (startTimeout) clearTimeout(startTimeout);
                stream.destroy(new Error("Aborted by timeout"));
              });
              stream.on("error", (err) => {
                if (inactivityTimeout) clearTimeout(inactivityTimeout);
                if (startTimeout) clearTimeout(startTimeout);
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
                if (inactivityTimeout) clearTimeout(inactivityTimeout);
                pass.destroy(new Error("Aborted by timeout"));
              });
              upload
                .done()
                .then(() => {
                  if (inactivityTimeout) clearTimeout(inactivityTimeout);
                  resolve(undefined);
                })
                .catch((err) => {
                  if (inactivityTimeout) clearTimeout(inactivityTimeout);
                  if (abortController.signal.aborted) {
                    reject(new Error("Aborted by timeout"));
                  } else {
                    console.error(`S3 upload error for ${youtube_id}:`, err);
                    reject(err);
                  }
                });
            });
            await uploadPromise;
            console.log(
              `\x1b[32mSuccessfully uploaded ${youtube_id} to S3 as ${s3Key}\x1b[0m`
            );
            // Add a timeout of 5s with up to 5 retries for DB update
            const updateWithTimeout = async (retries = 5): Promise<void> => {
              for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                  await Promise.race([
                    db
                      .updateTable("song_youtube_status")
                      .set({
                        status: "completed",
                        updated_at: new Date().toISOString(),
                        error_message: null,
                      })
                      .where("youtube_id", "=", youtube_id)
                      .where("status", "=", "processing")
                      .execute(),
                    new Promise((_, reject) =>
                      setTimeout(
                        () => reject(new Error("DB update timeout after 2s")),
                        2000
                      )
                    ),
                  ]);
                  return; // Success
                } catch (err) {
                  if (attempt === retries) {
                    throw err;
                  }
                  console.error(
                    `DB update attempt ${attempt} failed for ${youtube_id}, retrying...`,
                    err
                  );
                }
              }
            };
            await updateWithTimeout();
            console.log(
              `\x1b[32mMarked ${youtube_id} as completed in database\x1b[0m`
            );
            await sendSuccessEmail(youtube_id);
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
        if (currentRetry < 3) {
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
          await sendFailureEmail(youtube_id, err);
        }
      }
    } catch (err) {
      console.error("\x1b[31mWorker loop error:\x1b[0m", err);
      // Exit the process on fatal worker error
      process.exit(1);
    }

    await new Promise((res) => setTimeout(res, 100));
  }
}

// Healthcheck server
const port = process.env.WORKER_SERVER_PORT
  ? parseInt(process.env.WORKER_SERVER_PORT, 10)
  : 8080;

const healthServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
healthServer.listen(port, () => {
  console.log(`Healthcheck server listening on port ${port}`);
});

workerLoop();
