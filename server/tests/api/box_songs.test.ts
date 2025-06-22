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

describe("BoxSongs API", () => {
  let boxId: string;
  let boxSlug: string;
  let songId: string;
  let userId: string;
  let relId: string;
  let slugRelId: string;

  before(async () => {
    const userRes = await request(app)
      .post("/api/users")
      .send({ fingerprint: "fp-test", username: "testuser" });
    userId = userRes.body.id;
    const boxRes = await request(app)
      .post("/api/boxes")
      .send({ name: "BoxForRel", user_id: userId });
    boxId = boxRes.body.id;
    boxSlug = boxRes.body.slug;
    const songRes = await request(app)
      .post("/api/songs")
      .send({ title: "SongForRel", artist: "Artist" });
    songId = songRes.body.id;
  });

  it("should create a box-song relation", async () => {
    await request(app).delete(`/api/box_songs/${relId}`);
    const res = await request(app)
      .post("/api/box_songs")
      .send({ box_id: boxId, song_id: songId, user_id: userId, position: 1 });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    relId = res.body.id;
  });

  it("should create a box-song relation using box slug", async () => {
    await request(app).delete(`/api/box_songs/${relId}`);
    const res = await request(app)
      .post("/api/box_songs")
      .send({ box_id: boxSlug, song_id: songId, user_id: userId, position: 1 });
    if (res.status !== 201) {
      console.error("Error response:", res.body);
    }
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    slugRelId = res.body.id;
    expect(res.body.box_id).to.equal(boxId);
    relId = res.body.id;
  });

  it("should list box-song relations", async () => {
    const res = await request(app).get("/api/box_songs");
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an("array");
    const relation = res.body.data.find((rel: any) => rel.id === relId);
    expect(relation).to.exist;
    expect(relation.box_id).to.equal(boxId);
    expect(relation.song_id).to.equal(songId);
  });

  it("should get a relation by id", async () => {
    const res = await request(app).get(`/api/box_songs/${relId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("id", relId);
  });

  it("should update a relation", async () => {
    const res = await request(app)
      .put(`/api/box_songs/${relId}`)
      .send({ position: 2 });
    expect(res.status).to.equal(200);
    expect(res.body.position).to.equal(2);
  });

  it("should update the status of a relation", async () => {
    const res = await request(app)
      .put(`/api/box_songs/${relId}`)
      .send({ status: "playing" });
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("playing");
  });

  it("should delete a relation", async () => {
    const res = await request(app).delete(`/api/box_songs/${relId}`);
    expect(res.status).to.equal(204);
  });

  it("should return 404 for deleted relation", async () => {
    const res = await request(app).get(`/api/box_songs/${relId}`);
    expect(res.status).to.equal(404);
  });
});
