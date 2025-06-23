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

describe("Users API", () => {
  let userAId: string;
  let userBId: string;
  const fingerprintA = "fp-a-123";
  const usernameA = "userA";
  const fingerprintB = "fp-b-456";
  const usernameB = "userB";

  it("should create a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ fingerprint: fingerprintA, username: usernameA });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    expect(res.body.fingerprint).to.equal(fingerprintA);
    expect(res.body.username).to.equal(usernameA);
    userAId = res.body.id;
  });

  it("should not allow duplicate fingerprint on create", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ fingerprint: fingerprintA, username: "other" });
    expect(res.status).to.equal(409);
  });

  it("should create a second user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ fingerprint: fingerprintB, username: usernameB });
    expect(res.status).to.equal(201);
    userBId = res.body.id;
  });

  it("should get a user by id", async () => {
    const res = await request(app).get(`/api/users/${userAId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      id: userAId,
      fingerprint: fingerprintA,
      username: usernameA,
    });
  });

  it("should get a user by fingerprint", async () => {
    const res = await request(app).get(`/api/users/${fingerprintA}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      id: userAId,
      fingerprint: fingerprintA,
      username: usernameA,
    });
  });

  it("should get users by multiple ids", async () => {
    const res = await request(app)
      .get("/api/users/by-ids")
      .query({ ids: `${userAId},${userBId}` });
    expect(res.status).to.equal(200);
    expect(res.body)
      .to.be.an("array")
      .that.deep.includes({
        id: userAId,
        fingerprint: fingerprintA,
        username: usernameA,
      })
      .and.deep.includes({
        id: userBId,
        fingerprint: fingerprintB,
        username: usernameB,
      });
  });

  it("should update a user's username", async () => {
    const newUsername = "userA-updated";
    const res = await request(app)
      .put(`/api/users/${userAId}`)
      .send({ username: newUsername });
    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal(newUsername);
  });

  it("should update a user's fingerprint", async () => {
    const newFingerprint = "fp-a-new";
    const res = await request(app)
      .put(`/api/users/${userAId}`)
      .send({ fingerprint: newFingerprint });
    expect(res.status).to.equal(200);
    expect(res.body.fingerprint).to.equal(newFingerprint);
  });

  it("should not allow updating to an existing fingerprint", async () => {
    const res = await request(app)
      .put(`/api/users/${userBId}`)
      .send({ fingerprint: "fp-a-new" });
    expect(res.status).to.equal(409);
  });

  it("should delete a user", async () => {
    const res = await request(app).delete(`/api/users/${userAId}`);
    expect(res.status).to.equal(204);
  });

  it("should return 404 for deleted user", async () => {
    const res = await request(app).get(`/api/users/${userAId}`);
    expect(res.status).to.equal(404);
  });
});
