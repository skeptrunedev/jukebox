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

describe("YouTube Audio API", () => {
  describe("GET /api/youtube/audio", () => {
    it("should return 400 for missing videoId", async () => {
      const response = await request(app).get("/api/youtube/audio").expect(400);

      expect(response.body).to.have.property(
        "error",
        "Missing videoId parameter"
      );
    });

    it("should return 400 for invalid videoId format", async () => {
      const response = await request(app)
        .get("/api/youtube/audio")
        .query({ videoId: "invalid-id" })
        .expect(400);

      expect(response.body).to.have.property("error", "Invalid videoId format");
    });

    it("should stream audio data for valid YouTube video", async function () {
      // Increase timeout for this test as it involves real YouTube downloads
      this.timeout(60000);

      // Using a known short YouTube video (replace with a reliable test video)
      const testVideoId = "npvNPORFXpc"; // Rick Astley - Never Gonna Give You Up

      const response = await request(app)
        .get("/api/youtube/audio")
        .query({ videoId: testVideoId })
        .expect(200);

      // Verify streaming headers
      expect(response.headers["content-type"]).to.equal("audio/mpeg");
      expect(response.headers["transfer-encoding"]).to.equal("chunked");
      expect(response.headers["accept-ranges"]).to.equal("bytes");

      // Verify we received audio data
      expect(response.body).to.be.instanceOf(Buffer);
      expect(response.body.length).to.be.greaterThan(0);
    });

    it("should properly stream data in chunks (not one large response)", async function () {
      this.timeout(60000);

      const testVideoId = "npvNPORFXpc";
      let chunkCount = 0;
      let totalBytes = 0;
      let firstChunkTime = 0;
      let lastChunkTime = 0;
      const chunkSizes: number[] = [];

      const fetch = await import("node-fetch");

      return new Promise(async (resolve, reject) => {
        try {
          const response = await fetch.default(
            `http://localhost:${
              process.env.API_SERVER_PORT || 3000
            }/api/youtube/audio?videoId=${testVideoId}`
          );

          console.log(`Received response with status: ${response.status}`);
          expect(response.status).to.equal(200);
          expect(response.headers.get("transfer-encoding")).to.equal("chunked");

          firstChunkTime = Date.now();

          if (!response.body) {
            throw new Error("No response body");
          }

          // Use Node.js stream for reading chunks
          for await (const chunk of response.body) {
            chunkCount++;
            totalBytes += chunk.length;
            chunkSizes.push(chunk.length);
            lastChunkTime = Date.now();
          }

          // Verify we received multiple chunks (indicating streaming)
          expect(chunkCount).to.be.greaterThan(
            1,
            "Should receive multiple chunks for streaming"
          );

          // Verify total data size is reasonable for audio
          expect(totalBytes).to.be.greaterThan(
            1000,
            "Should receive substantial audio data"
          );

          // Verify streaming took some time (not instantaneous)
          const streamDuration = lastChunkTime - firstChunkTime;
          expect(streamDuration).to.be.greaterThan(
            100,
            "Streaming should take measurable time"
          );

          // Log streaming statistics for debugging
          console.log(`Streaming stats:
        - Chunks received: ${chunkCount}
        - Total bytes: ${totalBytes}
        - Stream duration: ${streamDuration}ms
        - Average chunk size: ${Math.round(totalBytes / chunkCount)} bytes
        - Min chunk size: ${Math.min(...chunkSizes)} bytes
        - Max chunk size: ${Math.max(...chunkSizes)} bytes`);

          resolve(undefined);
        } catch (error) {
          reject(error);
        }

        // Set a timeout for the entire operation
        setTimeout(() => {
          reject(new Error("Test timed out"));
        }, 55000);
      });
    });
  });
});
