import { expect } from "chai";
import request from "supertest";
import app from "../../src/index";
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

describe("Boxes API", () => {
  let boxId: string;
  let boxSlug: string;

  it("should create a box with a slug that has a space", async () => {
    const res = await request(app)
      .post("/api/boxes")
      .send({ name: "Test Space Box", slug: "Test Space Box" });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    expect(res.body.name).to.equal("Test Space Box");
    expect(res.body.slug).to.equal("test-space-box");
    boxId = res.body.id;
    boxSlug = res.body.slug;
  });

  it("should create a box", async () => {
    const res = await request(app)
      .post("/api/boxes")
      .send({ name: "TestBox", slug: "test-box" });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
    expect(res.body.name).to.equal("TestBox");
    expect(res.body.slug).to.equal("test-box");
    boxId = res.body.id;
    boxSlug = res.body.slug;
  });

  it("should list boxes", async () => {
    const res = await request(app).get("/api/boxes");
    expect(res.status).to.equal(200);
    expect(res.body.data)
      .to.be.an("array")
      .that.deep.includes({ id: boxId, name: "TestBox", slug: boxSlug });
  });

  it("should get a box by id", async () => {
    const res = await request(app).get(`/api/boxes/${boxId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      id: boxId,
      name: "TestBox",
      slug: boxSlug,
    });
  });

  it("should get a box by slug", async () => {
    const res = await request(app).get(`/api/boxes/${boxSlug}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      id: boxId,
      name: "TestBox",
      slug: boxSlug,
    });
  });

  it("should update a box", async () => {
    const res = await request(app)
      .put(`/api/boxes/${boxId}`)
      .send({ name: "RenamedBox" });
    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal("RenamedBox");
    expect(res.body.slug).to.equal(boxSlug);
  });

  it("should delete a box", async () => {
    const res = await request(app).delete(`/api/boxes/${boxId}`);
    expect(res.status).to.equal(204);
  });

  it("should return 404 for deleted box", async () => {
    const res = await request(app).get(`/api/boxes/${boxId}`);
    expect(res.status).to.equal(404);
  });
});
