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
 *     BoxSong:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         box_id:
 *           type: string
 *         song_id:
 *           type: string
 *         position:
 *           type: integer
 */
import express, { NextFunction } from "express";
import cors from "cors";
import db from "./db";
import { randomUUID } from "crypto";
import { sql } from "kysely";
import { setupSwagger } from './swagger';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
setupSwagger(app);

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
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/boxes/{id}:
 *   get:
 *     tags:
 *       - Boxes
 *     summary: Get a single box by ID
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
    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where("id", "=", req.params.id)
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
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Created box
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 */
app.post("/api/boxes", async (req, res, _next: NextFunction) => {
  try {
    const id = randomUUID();
    const { name } = req.body;
    await db.insertInto("boxes").values({ id, name }).execute();
    res.status(201).json({ id, name });
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
 *     summary: Update a box's name
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
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Updated box
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       404:
 *         description: Box not found
 */
app.put("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const { name } = req.body;
    const updatedRows = await db
      .updateTable("boxes")
      .set({ name })
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return void res.status(404).json({ error: "Box not found" });
    }
    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    res.json(box);
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
 *     summary: Delete a box by ID
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
    const deletedRows = await db
      .deleteFrom("boxes")
      .where("id", "=", req.params.id)
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
 * /api/songs:
 *   get:
 *     tags:
 *       - Songs
 *     summary: Get all songs
 *     responses:
 *       200:
 *         description: A list of songs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Song'
 */
app.get("/api/songs", async (req, res, _next: NextFunction) => {
  try {
    const songs = await db.selectFrom("songs").selectAll().execute();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /api/songs/{id}:
 *   get:
 *     tags:
 *       - Songs
 *     summary: Get a song by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A song object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 *       404:
 *         description: Song not found
 */
app.get("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const song = await db
      .selectFrom("songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    if (!song) {
      return void res.status(404).json({ error: "Song not found" });
    }
    res.json(song);
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
    const { title, artist } = req.body;
    await db.insertInto("songs").values({ id, title, artist }).execute();
    res.status(201).json({ id, title, artist });
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
    const { title, artist } = req.body;
    const updatedRows = await db
      .updateTable("songs")
      .set({ title, artist })
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
 * /api/box_songs:
 *   get:
 *     tags:
 *       - BoxSongs
 *     summary: Get all box-song relationships
 *     responses:
 *       200:
 *         description: A list of box-song relations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoxSong'
 */
app.get("/api/box_songs", async (req, res, _next: NextFunction) => {
  try {
    const rels = await db.selectFrom("box_songs").selectAll().execute();
    res.json(rels);
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
 *               song_id:
 *                 type: string
 *               position:
 *                 type: integer
 *             required:
 *               - box_id
 *               - song_id
 *               - position
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
    const { box_id, song_id, position } = req.body;
    await db
      .insertInto("box_songs")
      .values({ id, box_id, song_id, position })
      .execute();
    res.status(201).json({ id, box_id, song_id, position });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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
 *               position:
 *                 type: integer
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
    const { box_id, song_id, position } = req.body;
    const updates: Record<string, unknown> = {};
    if (box_id !== undefined) updates.box_id = box_id;
    if (song_id !== undefined) updates.song_id = song_id;
    if (position !== undefined) updates.position = position;
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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export default app;
