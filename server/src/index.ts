import express, { NextFunction } from "express";
import cors from "cors";
import db from "./db";
import { randomUUID } from "crypto";
import { sql } from "kysely";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.get("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const box = await db
      .selectFrom("boxes")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    if (!box) {
      return res.status(404).json({ error: "Box not found" });
    }
    res.json(box);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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

app.put("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const { name } = req.body;
    const updatedRows = await db
      .updateTable("boxes")
      .set({ name })
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return res.status(404).json({ error: "Box not found" });
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

app.delete("/api/boxes/:id", async (req, res, _next: NextFunction) => {
  try {
    const deletedRows = await db
      .deleteFrom("boxes")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return res.status(404).json({ error: "Box not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/songs", async (req, res, _next: NextFunction) => {
  try {
    const songs = await db.selectFrom("songs").selectAll().execute();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const song = await db
      .selectFrom("songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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

app.put("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const { title, artist } = req.body;
    const updatedRows = await db
      .updateTable("songs")
      .set({ title, artist })
      .where("id", "=", req.params.id)
      .execute();
    if (!updatedRows.length) {
      return res.status(404).json({ error: "Song not found" });
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

app.delete("/api/songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const deletedRows = await db
      .deleteFrom("songs")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/box_songs", async (req, res, _next: NextFunction) => {
  try {
    const rels = await db.selectFrom("box_songs").selectAll().execute();
    res.json(rels);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/box_songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const rel = await db
      .selectFrom("box_songs")
      .selectAll()
      .where("id", "=", req.params.id)
      .executeTakeFirst();
    if (!rel) {
      return res.status(404).json({ error: "Relation not found" });
    }
    res.json(rel);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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
      return res.status(404).json({ error: "Relation not found" });
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

app.delete("/api/box_songs/:id", async (req, res, _next: NextFunction) => {
  try {
    const deletedRows = await db
      .deleteFrom("box_songs")
      .where("id", "=", req.params.id)
      .execute();
    if (!deletedRows.length) {
      return res.status(404).json({ error: "Relation not found" });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
