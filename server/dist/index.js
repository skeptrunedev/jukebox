"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const crypto_1 = require("crypto");
const kysely_1 = require("kysely");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/boxes", async (req, res, _next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const boxes = await db_1.default
            .selectFrom("boxes")
            .selectAll()
            .limit(limit)
            .offset(offset)
            .execute();
        const totalResult = await db_1.default
            .selectFrom("boxes")
            .select((0, kysely_1.sql) `count(*)`.as("count"))
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/boxes/:id", async (req, res, _next) => {
    try {
        const box = await db_1.default
            .selectFrom("boxes")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        if (!box) {
            return res.status(404).json({ error: "Box not found" });
        }
        res.json(box);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/boxes", async (req, res, _next) => {
    try {
        const id = (0, crypto_1.randomUUID)();
        const { name } = req.body;
        await db_1.default.insertInto("boxes").values({ id, name }).execute();
        res.status(201).json({ id, name });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put("/api/boxes/:id", async (req, res, _next) => {
    try {
        const { name } = req.body;
        const updatedRows = await db_1.default
            .updateTable("boxes")
            .set({ name })
            .where("id", "=", req.params.id)
            .execute();
        if (!updatedRows.length) {
            return res.status(404).json({ error: "Box not found" });
        }
        const box = await db_1.default
            .selectFrom("boxes")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        res.json(box);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete("/api/boxes/:id", async (req, res, _next) => {
    try {
        const deletedRows = await db_1.default
            .deleteFrom("boxes")
            .where("id", "=", req.params.id)
            .execute();
        if (!deletedRows.length) {
            return res.status(404).json({ error: "Box not found" });
        }
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/songs", async (req, res, _next) => {
    try {
        const songs = await db_1.default.selectFrom("songs").selectAll().execute();
        res.json(songs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/songs/:id", async (req, res, _next) => {
    try {
        const song = await db_1.default
            .selectFrom("songs")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }
        res.json(song);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/songs", async (req, res, _next) => {
    try {
        const id = (0, crypto_1.randomUUID)();
        const { title, artist } = req.body;
        await db_1.default.insertInto("songs").values({ id, title, artist }).execute();
        res.status(201).json({ id, title, artist });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put("/api/songs/:id", async (req, res, _next) => {
    try {
        const { title, artist } = req.body;
        const updatedRows = await db_1.default
            .updateTable("songs")
            .set({ title, artist })
            .where("id", "=", req.params.id)
            .execute();
        if (!updatedRows.length) {
            return res.status(404).json({ error: "Song not found" });
        }
        const song = await db_1.default
            .selectFrom("songs")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        res.json(song);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete("/api/songs/:id", async (req, res, _next) => {
    try {
        const deletedRows = await db_1.default
            .deleteFrom("songs")
            .where("id", "=", req.params.id)
            .execute();
        if (!deletedRows.length) {
            return res.status(404).json({ error: "Song not found" });
        }
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/box_songs", async (req, res, _next) => {
    try {
        const rels = await db_1.default.selectFrom("box_songs").selectAll().execute();
        res.json(rels);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/box_songs/:id", async (req, res, _next) => {
    try {
        const rel = await db_1.default
            .selectFrom("box_songs")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        if (!rel) {
            return res.status(404).json({ error: "Relation not found" });
        }
        res.json(rel);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/box_songs", async (req, res, _next) => {
    try {
        const id = (0, crypto_1.randomUUID)();
        const { box_id, song_id, position } = req.body;
        await db_1.default
            .insertInto("box_songs")
            .values({ id, box_id, song_id, position })
            .execute();
        res.status(201).json({ id, box_id, song_id, position });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put("/api/box_songs/:id", async (req, res, _next) => {
    try {
        const { box_id, song_id, position } = req.body;
        const updates = {};
        if (box_id !== undefined)
            updates.box_id = box_id;
        if (song_id !== undefined)
            updates.song_id = song_id;
        if (position !== undefined)
            updates.position = position;
        const updatedRows = await db_1.default
            .updateTable("box_songs")
            .set(updates)
            .where("id", "=", req.params.id)
            .execute();
        if (!updatedRows.length) {
            return res.status(404).json({ error: "Relation not found" });
        }
        const rel = await db_1.default
            .selectFrom("box_songs")
            .selectAll()
            .where("id", "=", req.params.id)
            .executeTakeFirst();
        res.json(rel);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete("/api/box_songs/:id", async (req, res, _next) => {
    try {
        const deletedRows = await db_1.default
            .deleteFrom("box_songs")
            .where("id", "=", req.params.id)
            .execute();
        if (!deletedRows.length) {
            return res.status(404).json({ error: "Relation not found" });
        }
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
