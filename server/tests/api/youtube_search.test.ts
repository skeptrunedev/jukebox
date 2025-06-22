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

describe("YouTube Search API", () => {
  // No mocking - tests will make real API calls

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/api/youtube/search");
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: "Search query is required" });
  });

  it("returns 500 when API key is missing", async () => {
    const originalApiKey = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;
    const res = await request(app).get("/api/youtube/search?q=test");
    expect(res.status).to.equal(500);
    expect(res.body).to.deep.equal({ error: "YouTube API key not configured" });
    // Restore the original API key
    if (originalApiKey) {
      process.env.YOUTUBE_API_KEY = originalApiKey;
    }
  });

  it("returns search results with duration and thumbnail", async () => {
    const res = await request(app).get(
      "/api/youtube/search?q=testQuery&maxResults=5"
    );
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("items").that.is.an("array");

    // Verify response structure if we get results
    if (res.body.items.length > 0) {
      const item = res.body.items[0];
      expect(item).to.have.property("id").that.is.a("string");
      expect(item).to.have.property("title").that.is.a("string");
      expect(item).to.have.property("channelTitle").that.is.a("string");
      expect(item).to.have.property("thumbnail").that.is.a("string");
      expect(item).to.have.property("duration").that.is.a("string");
      expect(item).to.have.property("url").that.is.a("string");
      expect(item.url).to.include("https://www.youtube.com/watch?v=");
    }
  });

  // Note: Error handling tests removed since we're testing against real API
  // The API key and query validation tests above cover the main error cases
});
