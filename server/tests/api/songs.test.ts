import { expect } from "chai";
import app from "../../src/index";
import request from "supertest";
import { Knex } from "knex";
import { migrateDb } from "../helpers/db";
import "mocha";

let knex: Knex;
before(async () => {
  knex = await migrateDb();
});
after(async () => {
  await knex.destroy();
});

describe("Songs API", () => {
  let songId: string;

  it("should create a song", async () => {
    const res = await request(app)
      .post("/api/songs")
      .send({ title: "TestSong", artist: "Artist" });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    expect(res.body.title).to.equal("TestSong");
    songId = res.body.id;
  });

  it("should list songs", async () => {
    const res = await request(app).get("/api/songs");
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array").that.deep.includes({
      id: songId,
      title: "TestSong",
      artist: "Artist",
      youtube_id: null,
      youtube_url: null,
      duration: null,
      thumbnail_url: null,
    });
  });

  it("should get a song by id", async () => {
    const res = await request(app).get(`/api/songs/${songId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      id: songId,
      title: "TestSong",
      artist: "Artist",
      youtube_id: null,
      youtube_url: null,
      duration: null,
      thumbnail_url: null,
    });
  });

  it("should update a song", async () => {
    const res = await request(app)
      .put(`/api/songs/${songId}`)
      .send({ title: "RenamedSong", artist: "Artist" });
    expect(res.status).to.equal(200);
    expect(res.body.title).to.equal("RenamedSong");
  });

  it("should delete a song", async () => {
    const res = await request(app).delete(`/api/songs/${songId}`);
    expect(res.status).to.equal(204);
  });

  it("should return 404 for deleted song", async () => {
    const res = await request(app).get(`/api/songs/${songId}`);
    expect(res.status).to.equal(404);
  });
});
