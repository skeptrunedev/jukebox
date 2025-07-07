import "dotenv/config";
// Redirect console output to a log sink file as well as stdout
import fs from "fs";
import util from "util";
import express, { NextFunction } from "express";
import cors from "cors";
import db from "./db";
import http from "http";
import { randomUUID } from "crypto";
import { sql } from "kysely";
import { setupSwagger } from "./swagger";
import fetch from "node-fetch";
import { S3 } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import nodemailer from "nodemailer";

// S3 configuration from .env
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

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === "true", // true for SSL/TLS, false for STARTTLS or plain
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

if (!fs.existsSync("logsinks")) {
  fs.mkdirSync("logsinks");
}
const logStream = fs.createWriteStream("logsinks/server-logsink.log", {
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

/**
 * @openapi
 * components:
 *   schemas:
 *     Box:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         user_id:
 *           type: string
 *     Song:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         artist:
 *           type: string
 *           nullable: true
 *         youtube_id:
 *           type: string
 *           nullable: true
 *         youtube_url:
 *           type: string
 *           nullable: true
 *         duration:
 *           type: integer
 *           nullable: true
 *         thumbnail_url:
 *           type: string
 *           nullable: true
 *     BoxSong:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         box_id:
 *           type: string
 *         song_id:
 *           type: string
 *         user_id:
 *           type: string
 *         position:
 *           type: integer
 *         status:
 *           type: string
 *           enum:
 *             - queued
 *             - playing
 *             - played
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fingerprint:
 *           type: string
 *         username:
 *           type: string
 */

const app = express();
const port = process.env.API_SERVER_PORT || 3001;

app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
  })
);
app.use(express.json());
0; // Log every incoming request and its outcome
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});
setupSwagger(app);

/**
 * @openapi
 * /api/users/by-ids:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get users by multiple IDs
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *           description: Comma-separated list of user IDs
 *         example: "1,2,3"
 *     responses:
 *       200:
 *         description: A list of users matching the provided IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or missing IDs parameter
 */
app.get("/api/users/by-ids", async (req, res) => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam || typeof idsParam !== "string") {
      return void res.status(400).json({
        error:
          "Missing or invalid 'ids' parameter. Expected comma-separated list of user IDs.",
      });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return void res.status(400).json({ error: "No valid IDs provided" });
    }

    const users = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "in", ids)
      .execute();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by ID or fingerprint
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID or fingerprint
 *     responses:
 *       200:
 *         description: A user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
app.get("/api/users/:id", async (req, res) => {
  try {
    const identifier = req.params.id;
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where(sql<boolean>`id = ${identifier} OR fingerprint = ${identifier}`)
      .executeTakeFirst();
    if (!user) {
      return void res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fingerprint:
 *                 type: string
 *               username:
 *                 type: string
 *             required:
 *               - fingerprint
 *               - username
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       409:
 *         description: Fingerprint already exists
 */
app.post("/api/users", async (req, res) => {
  try {
    const id = randomUUID();
    const { fingerprint, username } = req.body;
    const existing = await db
      .selectFrom("users")
      .select("id")
      .where("fingerprint", "=", fingerprint)
      .executeTakeFirst();
    if (existing) {
      return void res.status(409).json({ error: "Fingerprint already exists" });
    }

    await db
      .insertInto("users")
      .values({ id, fingerprint, username })
      .execute();
    res.status(201).json({ id, fingerprint, username });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user's fingerprint or username
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fingerprint:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       409:
 *         description: Fingerprint already exists
 */
app.put("/api/users/:id", async (req, res) => {
  try {
    const { fingerprint, username } = req.body;
    const updates: Record<string, unknown> = {};
    if (fingerprint !== undefined) {
      const existingFingerprint = await db
        .selectFrom("users")
        .select("id")
        .where("fingerprint", "=", fingerprint)
        .where("id", "!=", req.params.id)
        .executeTakeFirst();
      if (existingFingerprint) {
        return void res
          .status(409)
          .json({ error: "Fingerprint already exists" });
      }
      updates.fingerprint = fingerprint;
    }
    if (username !== undefined) updates.username = username;

    const updatedRows = await db
      .updateTable("users")
      .set(updates)
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return void res.status(404).json({ error: "User not found" });
    }
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content (user deleted)
 *       404:
 *         description: User not found
 */
app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedRows = await db
      .deleteFrom("users")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return void res.status(404).json({ error: "User not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/youtube/audio:
 *   get:
 *     tags:
 *       - YouTube
 *     summary: Get a signed URL to stream audio-only content for a YouTube video from S3
 *     parameters:
 *       - in: query
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The YouTube video ID to stream audio from
 *     responses:
 *       200:
 *         description: Signed URL to the audio file in S3
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       202:
 *         description: Audio not found in S3, processing in progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       400:
 *         description: Missing or invalid videoId parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Audio not found in S3
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to generate signed URL or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

app.get("/api/youtube/audio", async (req, res, _next: NextFunction) => {
  const videoId = req.query.videoId as string;

  if (!videoId) {
    return void res.status(400).json({ error: "Missing videoId parameter" });
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return void res.status(400).json({ error: "Invalid videoId format" });
  }

  const s3Key = `youtube-audio/${videoId}.webm`;

  try {
    // Check if the object exists in S3
    await s3.headObject({ Bucket: S3_BUCKET_NAME, Key: s3Key });

    // Generate a signed URL for streaming with the maximum allowed expiration (7 days = 604800 seconds)
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 604800 });

    res.json({ url });
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return void res.status(202).json({
        error: "Audio not found in S3, please wait while we process the video.",
      });
    }
    console.error("S3 error:", err);
    res
      .status(500)
      .json({ error: `Failed to generate signed URL: ${err.message}` });
  }
});

/**
 * @openapi
 * /api/boxes:
 *   get:
 *     tags:
 *       - Boxes
 *     summary: Get a paginated list of boxes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of boxes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Box'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
app.get("/api/boxes", async (req, res, _next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const boxes = await db
      .selectFrom("boxes")
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const totalResult = await db
      .selectFrom("boxes")
      .select(sql<number>`count(*)`.as("count"))
      .executeTakeFirst();
    const totalCount = totalResult?.count ?? 0;

    res.json({
      data: boxes,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return void res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes/{id}:
 *   get:
 *     tags:
 *       - Boxes
 *     summary: Get a single box by ID or slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A box object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       404:
 *         description: Box not found
 */
app.get("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where(sql<boolean>`id = ${identifier} OR slug = ${identifier}`)
      .executeTakeFirst();
    if (!box) {
      return void res.status(404).json({ error: "Box not found" });
    }
    res.json(box);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes:
 *   post:
 *     tags:
 *       - Boxes
 *     summary: Create a new box
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               user_id:
 *                 type: string
 *             required:
 *               - name
 *               - user_id
 *     responses:
 *       201:
 *         description: Created box
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       409:
 *         description: Slug already exists
 */
app.post("/api/boxes", async (req, res, _next: NextFunction) => {
  try {
    const id = randomUUID();
    const { name, slug: providedSlug, user_id } = req.body;
    // Validate that the user exists
    const user = await db
      .selectFrom("users")
      .select("id")
      .where("id", "=", user_id)
      .executeTakeFirst();
    if (!user) {
      return void res.status(400).json({ error: "User not found" });
    }
    // Generate slug from name if not provided
    let slug = (providedSlug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check for slug conflict and make unique if needed
    let uniqueSlug = slug;
    while (
      await db
        .selectFrom("boxes")
        .select("id")
        .where("slug", "=", uniqueSlug)
        .executeTakeFirst()
    ) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      uniqueSlug = `${slug}-${rand}`;
    }
    slug = uniqueSlug;

    await db.insertInto("boxes").values({ id, name, slug, user_id }).execute();
    res.status(201).json({ id, name, slug, user_id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes/{id}:
 *   put:
 *     tags:
 *       - Boxes
 *     summary: Update a box's name or user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated box
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       404:
 *         description: Box not found
 *       400:
 *         description: User not found
 */
app.put("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const { name, user_id } = req.body;
    const updates: Record<string, unknown> = {};

    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where(sql<boolean>`id = ${identifier} OR slug = ${identifier}`)
      .executeTakeFirst();

    if (!box) {
      return void res.status(404).json({ error: "Box not found" });
    }

    if (name !== undefined) updates.name = name;
    if (user_id !== undefined) {
      const user = await db
        .selectFrom("users")
        .select("id")
        .where("id", "=", user_id)
        .executeTakeFirst();
      if (!user) {
        return void res.status(400).json({ error: "User not found" });
      }
      updates.user_id = user_id;
    }

    const updatedRows = await db
      .updateTable("boxes")
      .set(updates)
      .where("id", "=", box.id)
      .execute();
    if (!updatedRows.length) {
      return void res.status(404).json({ error: "Box not found" });
    }
    const updatedBox = await db
      .selectFrom("boxes")
      .selectAll()
      .where("id", "=", box.id)
      .executeTakeFirst();
    res.json(updatedBox);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes/{id}:
 *   delete:
 *     tags:
 *       - Boxes
 *     summary: Delete a box by ID or slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content (box deleted)
 *       404:
 *         description: Box not found
 */
app.delete("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const identifier = req.params.id;
    const deletedRows = await db
      .deleteFrom("boxes")
      .where(sql<boolean>`id = ${identifier} OR slug = ${identifier}`)
      .execute();
    if (!deletedRows.length) {
      return void res.status(404).json({ error: "Box not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/songs/by-ids:
 *   get:
 *     tags:
 *       - Songs
 *     summary: Get songs by multiple IDs or YouTube IDs
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *           description: Comma-separated list of song IDs or YouTube IDs
 *         example: "1,2,3,abc123xyz78"
 *     responses:
 *       200:
 *         description: A list of songs matching the provided IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Song'
 *       400:
 *         description: Invalid or missing IDs parameter
 */
app.get("/api/songs/by-ids", async (req, res, _next: NextFunction) => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam || typeof idsParam !== "string") {
      return void res.status(400).json({
        error:
          "Missing or invalid 'ids' parameter. Expected comma-separated list of song IDs or YouTube IDs.",
      });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return void res.status(400).json({ error: "No valid IDs provided" });
    }

    // Query for songs where id or youtube_id matches any of the provided ids
    const songs = await db
      .selectFrom("songs")
      .selectAll()
      .where(({ or, eb }) =>
        or([eb("id", "in", ids), eb("youtube_id", "in", ids)])
      )
      .execute();

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/songs:
 *   post:
 *     tags:
 *       - Songs
 *     summary: Create a new song
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               youtube_id:
 *                 type: string
 *               youtube_url:
 *                 type: string
 *               duration:
 *                 type: integer
 *               thumbnail_url:
 *                 type: string
 *             required:
 *               - title
 *     responses:
 *       201:
 *         description: Created song
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 */
app.post("/api/songs", async (req, res, _next: NextFunction) => {
  try {
    const id = randomUUID();
    const { title, artist, youtube_id, youtube_url, duration, thumbnail_url } =
      req.body;
    await db
      .insertInto("songs")
      .values({
        id,
        title,
        artist,
        youtube_id,
        youtube_url,
        duration,
        thumbnail_url,
      })
      .execute();
    res.status(201).json({
      id,
      title,
      artist,
      youtube_id,
      youtube_url,
      duration,
      thumbnail_url,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/songs/{id}:
 *   put:
 *     tags:
 *       - Songs
 *     summary: Update a song by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               youtube_id:
 *                 type: string
 *               youtube_url:
 *                 type: string
 *               duration:
 *                 type: integer
 *               thumbnail_url:
 *                 type: string
 *             required:
 *               - title
 *     responses:
 *       200:
 *         description: Updated song
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 *       404:
 *         description: Song not found
 */
app.put("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const { title, artist, youtube_id, youtube_url, duration, thumbnail_url } =
      req.body;
    const updatedRows = await db
      .updateTable("songs")
      .set({ title, artist, youtube_id, youtube_url, duration, thumbnail_url })
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return void res.status(404).json({ error: "Song not found" });
    }
    const song = await db
      .selectFrom("songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/songs/{id}:
 *   delete:
 *     tags:
 *       - Songs
 *     summary: Delete a song by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content (song deleted)
 *       404:
 *         description: Song not found
 */
app.delete("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const deletedRows = await db
      .deleteFrom("songs")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return void res.status(404).json({ error: "Song not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes/{boxId}/songs:
 *   get:
 *     tags:
 *       - BoxSongs
 *     summary: Get all box-song relationships for a specific box with pagination
 *     parameters:
 *       - in: path
 *         name: boxId
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID or slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: A paginated list of box-song relations for the specified box
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoxSong'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       404:
 *         description: Box not found
 */
app.get("/api/boxes/:boxId/songs", async (req, res, _next: NextFunction) => {
  try {
    const boxIdentifier = req.params.boxId;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate that the box exists (accepting either box ID or slug)
    const box = await db
      .selectFrom("boxes")
      .select("id")
      .where(sql<boolean>`id = ${boxIdentifier} OR slug = ${boxIdentifier}`)
      .executeTakeFirst();

    if (!box) {
      return void res.status(404).json({ error: "Box not found" });
    }

    const rels = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("box_id", "=", box.id)
      .orderBy("position", "asc")
      .orderBy("id", "asc")
      .limit(limit)
      .offset(offset)
      .execute();

    const totalResult = await db
      .selectFrom("box_songs")
      .select(sql<number>`count(*)`.as("count"))
      .where("box_id", "=", box.id)
      .executeTakeFirst();
    const totalCount = totalResult?.count ?? 0;

    res.json({
      data: rels,
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/box_songs/{id}:
 *   get:
 *     tags:
 *       - BoxSongs
 *     summary: Get a specific box-song relationship by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Box-song relation object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoxSong'
 *       404:
 *         description: Relation not found
 */
app.get("/api/box_songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const rel = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    if (!rel) {
      return void res.status(404).json({ error: "Relation not found" });
    }
    res.json(rel);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/box_songs:
 *   post:
 *     tags:
 *       - BoxSongs
 *     summary: Create a new box-song relationship
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               box_id:
 *                 type: string
 *                 description: Box ID or slug
 *               song_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum:
 *                   - queued
 *                   - playing
 *                   - played
 *                 default: queued
 *             required:
 *               - box_id
 *               - song_id
 *               - user_id
 *     responses:
 *       201:
 *         description: Created box-song relation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoxSong'
 */
app.post("/api/box_songs", async (req, res, _next: NextFunction) => {
  try {
    const id = randomUUID();
    let { box_id, song_id, user_id, status = "queued" } = req.body;

    // Validate that the box exists (accepting either box ID or slug)
    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where(sql<boolean>`id = ${box_id} OR slug = ${box_id}`)
      .executeTakeFirst();
    if (!box) {
      return void res.status(400).json({ error: "Box not found" });
    }
    // Use the resolved box ID for the relation
    box_id = box.id;

    // Validate that the song exists
    const song = await db
      .selectFrom("songs")
      .selectAll()
      .where("id", "=", song_id)
      .executeTakeFirst();
    if (!song) {
      return void res.status(400).json({ error: "Song not found" });
    }

    // Validate that the user exists
    const user = await db
      .selectFrom("users")
      .select("id")
      .where("id", "=", user_id)
      .executeTakeFirst();
    if (!user) {
      return void res.status(400).json({ error: "User not found" });
    }

    // Get all queued songs in this box ordered by position
    const queuedSongs = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("box_id", "=", box_id)
      .orderBy("position", "asc")
      .execute();

    let insertPosition: number;

    if (queuedSongs.length === 0) {
      // First song in queue
      insertPosition = 1;
    } else {
      // Find the best position using round-robin fairness
      insertPosition = findFairPosition(queuedSongs, user_id);
    }

    // Shift positions of songs that come after the insert position
    await db
      .updateTable("box_songs")
      .set({ position: sql`position + 1` })
      .where("box_id", "=", box_id)
      .where("position", ">=", insertPosition)
      .execute();

    await db
      .insertInto("box_songs")
      .values({
        id,
        box_id,
        song_id,
        user_id,
        position: insertPosition,
        status,
      })
      .execute();

    const rel = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    res.status(201).json(rel);
  } catch (error) {
    console.error("Error creating box_song relation:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Find the fairest position to insert a new song using round-robin logic.
 * If the same user adds a song twice in a row, their second song will always go after the first instead of before.
 */
function findFairPosition(queuedSongs: any[], newUserId: string): number {
  if (queuedSongs.length === 0) return 1;

  // Look for the first position where we can insert without violating fairness
  for (let i = 0; i < queuedSongs.length; i++) {
    const currentSong = queuedSongs[i];
    const nextSong = queuedSongs[i + 1];

    // If there's no next song, we can add at the end
    if (!nextSong) {
      return currentSong.position + 1;
    }

    // If this is the same user, skip to avoid putting same user consecutively
    if (currentSong.user_id === newUserId) {
      continue;
    }

    // If the current and next songs are from the same user (not the new user),
    // we should insert between them to break up their consecutive songs
    if (
      currentSong.user_id === nextSong.user_id &&
      currentSong.user_id !== newUserId
    ) {
      return currentSong.position + 1;
    }

    // If we're at a transition between different users and neither is the new user,
    // this is a good spot to maintain round-robin fairness
    if (
      currentSong.user_id !== nextSong.user_id &&
      currentSong.user_id !== newUserId &&
      nextSong.user_id !== newUserId
    ) {
      return nextSong.position;
    }
  }

  // If we can't find a fair spot in the middle, add to the end
  return queuedSongs[queuedSongs.length - 1].position + 1;
}

/**
 * @openapi
 * /api/box_songs/{id}:
 *   put:
 *     tags:
 *       - BoxSongs
 *     summary: Update a box-song relationship
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               box_id:
 *                 type: string
 *               song_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               position:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum:
 *                   - queued
 *                   - playing
 *                   - played
 *     responses:
 *       200:
 *         description: Updated box-song relation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoxSong'
 *       404:
 *         description: Relation not found
 */
app.put("/api/box_songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const { box_id, song_id, user_id, position, status } = req.body;
    const updates: Record<string, unknown> = {};

    // Get the current relation
    const currentRel = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();

    if (!currentRel) {
      return void res.status(404).json({ error: "Relation not found" });
    }

    // Validate box_id if provided
    if (box_id !== undefined) {
      const box = await db
        .selectFrom("boxes")
        .selectAll()
        .where("id", "=", box_id)
        .executeTakeFirst();
      if (!box) {
        return void res.status(400).json({ error: "Box not found" });
      }
      updates.box_id = box_id;
    }

    // Validate song_id if provided
    if (song_id !== undefined) {
      const song = await db
        .selectFrom("songs")
        .selectAll()
        .where("id", "=", song_id)
        .executeTakeFirst();
      if (!song) {
        return void res.status(400).json({ error: "Song not found" });
      }
      updates.song_id = song_id;
    }

    if (status !== undefined) {
      if (!["queued", "playing", "played"].includes(status as string)) {
        return void res.status(400).json({ error: "Invalid status" });
      }
      updates.status = status;
    }

    // Validate user_id if provided
    if (user_id !== undefined) {
      const user = await db
        .selectFrom("users")
        .select("id")
        .where("id", "=", user_id)
        .executeTakeFirst();
      if (!user) {
        return void res.status(400).json({ error: "User not found" });
      }
      updates.user_id = user_id;
    }

    // Handle position change
    if (
      position !== undefined &&
      typeof position === "number" &&
      position !== currentRel.position
    ) {
      // Only allow moving within the same box
      const boxId = updates.box_id ?? currentRel.box_id;

      // Get min/max position in the box
      if (typeof boxId !== "string") {
        return void res.status(400).json({ error: "Invalid box_id" });
      }
      const minMax = await db
        .selectFrom("box_songs")
        .select([
          sql<number>`MIN(position)`.as("min"),
          sql<number>`MAX(position)`.as("max"),
        ])
        .where("box_id", "=", boxId)
        .executeTakeFirst();

      const minPos = minMax?.min ?? 1;
      const maxPos = minMax?.max ?? 1;
      let newPosition = Math.max(minPos, Math.min(position, maxPos));

      // If moving up (to a lower position number)
      if (newPosition < currentRel.position) {
        // Shift all songs between newPosition and currentRel.position - 1 down (+1)
        await db
          .updateTable("box_songs")
          .set({ position: sql`position + 1` })
          .where("box_id", "=", boxId)
          .where("position", ">=", newPosition)
          .where("position", "<", currentRel.position)
          .execute();
      }
      // If moving down (to a higher position number)
      else if (newPosition > currentRel.position) {
        // Shift all songs between currentRel.position + 1 and newPosition up (-1)
        await db
          .updateTable("box_songs")
          .set({ position: sql`position - 1` })
          .where("box_id", "=", boxId)
          .where("position", "<=", newPosition)
          .where("position", ">", currentRel.position)
          .execute();
      }

      updates.position = newPosition;
    }

    const updatedRows = await db
      .updateTable("box_songs")
      .set(updates)
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return void res.status(404).json({ error: "Relation not found" });
    }
    const rel = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    res.json(rel);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/box_songs/{id}:
 *   delete:
 *     tags:
 *       - BoxSongs
 *     summary: Delete a box-song relation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content (relation deleted)
 *       404:
 *         description: Relation not found
 */
app.delete("/api/box_songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const deletedRows = await db
      .deleteFrom("box_songs")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return void res.status(404).json({ error: "Relation not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/youtube/search:
 *   get:
 *     tags:
 *       - YouTube
 *     summary: Search YouTube for songs
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for YouTube videos
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: YouTube search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       channelTitle:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       duration:
 *                         type: string
 *                       url:
 *                         type: string
 *       400:
 *         description: Missing search query
 *       500:
 *         description: YouTube API error
 */
app.get("/api/youtube/search", async (req, res, _next: NextFunction) => {
  try {
    const query = req.query.q as string;
    const maxResults = parseInt(req.query.maxResults as string) || 10;

    if (!query) {
      return void res.status(400).json({ error: "Search query is required" });
    }

    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      return void res
        .status(500)
        .json({ error: "YouTube API key not configured" });
    }

    // Search for videos
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&videoCategoryId=10&` + // Music category
      `q=${encodeURIComponent(query)}&` +
      `maxResults=${maxResults}&` +
      `key=${API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      throw new Error(
        (searchData as any).error?.message || "YouTube API error"
      );
    }

    // Get video details for duration
    const videoIds = (searchData as any).items
      .map((item: any) => item.id.videoId)
      .join(",");
    const detailsUrl =
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails&` +
      `id=${videoIds}&` +
      `key=${API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok) {
      throw new Error(
        (detailsData as any).error?.message || "YouTube API error"
      );
    }

    // Combine search results with duration info
    const results = (searchData as any).items.map((item: any) => {
      const details = (detailsData as any).items.find(
        (d: any) => d.id === item.id.videoId
      );
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        duration: details?.contentDetails?.duration || "PT0S",
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    });

    res.json({ items: results });
  } catch (error) {
    console.error("YouTube search error:", error);
    // send an email on failure
    const SMTP_FROM_EMAIL =
      process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const mailOptions = {
      from: SMTP_FROM_EMAIL,
      to: SMTP_FROM_EMAIL,
      subject: `🚨🚨 Search Jukebox: YouTube search failed 🚨🚨`,
      text: `🚨 YouTube search failed for query: ${req.query.q}\n\nError 🚨: ${
        (error as Error).message
      }`,
    };
    try {
      smtpTransport.sendMail(mailOptions);
      console.log(`Failure email sent for YouTube search: ${req.query.q}`);
    } catch (emailErr) {
      console.error("Failed to send failure email:", emailErr);
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// Healthcheck route
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const server = http.createServer(app);
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
} else {
  // For testing, listen on ephemeral port bound to localhost
  server.listen(0, "127.0.0.1");
}

export default server;
