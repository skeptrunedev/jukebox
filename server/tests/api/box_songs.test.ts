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
    const res = await request(app).get(`/api/boxes/${boxId}/songs`);
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

  // Fair Queue Logic Tests
  describe("Fair Queue Logic", () => {
    let fairBoxId: string;
    let fairUserId1: string;
    let fairUserId2: string;
    let fairUserId3: string;
    let songId1: string;
    let songId2: string;
    let songId3: string;
    let songId4: string;
    let songId5: string;
    let songId6: string;

    before(async () => {
      // Create test box for fair queue tests
      const boxRes = await request(app)
        .post("/api/boxes")
        .send({ name: "FairQueueBox", user_id: userId });
      fairBoxId = boxRes.body.id;

      // Create additional users for testing
      const user1Res = await request(app)
        .post("/api/users")
        .send({ fingerprint: "fp-fair1", username: "fairuser1" });
      fairUserId1 = user1Res.body.id;

      const user2Res = await request(app)
        .post("/api/users")
        .send({ fingerprint: "fp-fair2", username: "fairuser2" });
      fairUserId2 = user2Res.body.id;

      const user3Res = await request(app)
        .post("/api/users")
        .send({ fingerprint: "fp-fair3", username: "fairuser3" });
      fairUserId3 = user3Res.body.id;

      // Create multiple songs for testing
      const song1Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song1", artist: "Artist1" });
      songId1 = song1Res.body.id;

      const song2Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song2", artist: "Artist2" });
      songId2 = song2Res.body.id;

      const song3Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song3", artist: "Artist3" });
      songId3 = song3Res.body.id;

      const song4Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song4", artist: "Artist4" });
      songId4 = song4Res.body.id;

      const song5Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song5", artist: "Artist5" });
      songId5 = song5Res.body.id;

      const song6Res = await request(app)
        .post("/api/songs")
        .send({ title: "Song6", artist: "Artist6" });
      songId6 = song6Res.body.id;
    });

    beforeEach(async () => {
      // Clean up any existing relations in the fair queue box before each test
      const relations = await request(app)
        .get(`/api/boxes/${fairBoxId}/songs`)
        .query({ limit: 100 });

      for (const rel of relations.body.data) {
        await request(app).delete(`/api/box_songs/${rel.id}`);
      }
    });

    it("should place first song at position 1 in empty queue", async () => {
      const res = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });

      expect(res.status).to.equal(201);
      expect(res.body.position).to.equal(1);
    });

    it("should maintain round-robin fairness with two users", async () => {
      // Add first song from user1
      const res1 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      expect(res1.body.position).to.equal(1);

      // Add first song from user2 - should go to position 2
      const res2 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId2 });
      expect(res2.body.position).to.equal(2);

      // Add second song from user1 - should go to position 3 (after user2's song)
      const res3 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId3, user_id: fairUserId1 });
      expect(res3.body.position).to.equal(3);

      // Verify final order by getting all relations
      const allRes = await request(app).get(`/api/boxes/${fairBoxId}/songs`);
      const boxSongs = allRes.body.data.sort(
        (a: any, b: any) => a.position - b.position
      );

      expect(boxSongs).to.have.length(3);
      expect(boxSongs[0].user_id).to.equal(fairUserId1); // position 1
      expect(boxSongs[1].user_id).to.equal(fairUserId2); // position 2
      expect(boxSongs[2].user_id).to.equal(fairUserId1); // position 3
    });

    it("should break up consecutive songs from same user", async () => {
      // Add two consecutive songs from user1
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId1 });

      // Add song from user2 - should be inserted between the two user1 songs
      const res3 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId3, user_id: fairUserId2 });

      // Get updated queue order
      const allRes = await request(app).get(`/api/boxes/${fairBoxId}/songs`);
      const boxSongs = allRes.body.data.sort(
        (a: any, b: any) => a.position - b.position
      );

      expect(boxSongs).to.have.length(3);
      expect(boxSongs[0].user_id).to.equal(fairUserId1); // position 1
      expect(boxSongs[1].user_id).to.equal(fairUserId2); // position 2 (inserted)
      expect(boxSongs[2].user_id).to.equal(fairUserId1); // position 3 (shifted)
    });

    it("should handle three users with round-robin fairness", async () => {
      // Create initial queue: User1, User2, User3
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId2 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId3, user_id: fairUserId3 });

      // Add another song from User1 - should go at end
      const res4 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId4, user_id: fairUserId1 });

      // Add another song from User2 - should go at end
      const res5 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId5, user_id: fairUserId2 });

      // Get final order
      const allRes = await request(app).get(`/api/boxes/${fairBoxId}/songs`);
      const boxSongs = allRes.body.data.sort(
        (a: any, b: any) => a.position - b.position
      );

      expect(boxSongs).to.have.length(5);
      // Should be: User1, User2, User3, User1, User2
      expect(boxSongs[0].user_id).to.equal(fairUserId1);
      expect(boxSongs[1].user_id).to.equal(fairUserId2);
      expect(boxSongs[2].user_id).to.equal(fairUserId3);
      expect(boxSongs[3].user_id).to.equal(fairUserId1);
      expect(boxSongs[4].user_id).to.equal(fairUserId2);
    });

    it("should handle single user adding multiple songs", async () => {
      // Add multiple songs from the same user
      const res1 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      const res2 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId1 });
      const res3 = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId3, user_id: fairUserId1 });

      // All should be consecutive since there's only one user
      expect(res1.body.position).to.equal(1);
      expect(res2.body.position).to.equal(2);
      expect(res3.body.position).to.equal(3);
    });

    it("should maintain fairness when inserting into complex queue", async () => {
      // Create complex initial queue: User1, User2, User3, User1, User3
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId1 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId3, user_id: fairUserId2 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId4, user_id: fairUserId3 });
      await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId5, user_id: fairUserId3 });

      // Add another song from User2 - should go after User3's last song
      const _newSongRes = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId6, user_id: fairUserId2 });

      // Get final order
      const allRes = await request(app).get(`/api/boxes/${fairBoxId}/songs`);
      const boxSongs = allRes.body.data.sort(
        (a: any, b: any) => a.position - b.position
      );

      expect(boxSongs).to.have.length(6);

      const expectedOrder = [
        fairUserId1,
        fairUserId2,
        fairUserId3,
        fairUserId1,
        fairUserId3,
        fairUserId2,
      ];
      const actualOrder = boxSongs.map((song: any) => song.user_id);

      expect(actualOrder).to.deep.equal(
        expectedOrder,
        `Expected queue order: [User1, User2, User3, User1, User3, User2] but got: ${actualOrder
          .map((id: string, index: number) => {
            if (id === fairUserId1) return `User1@${index}`;
            if (id === fairUserId2) return `User2@${index}`;
            if (id === fairUserId3) return `User3@${index}`;
            return `Unknown@${index}`;
          })
          .join(", ")}`
      );
    });

    it("should only consider queued songs for fair positioning", async () => {
      // Add a song and mark it as playing
      const playingRes = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId1, user_id: fairUserId1 });
      await request(app)
        .put(`/api/box_songs/${playingRes.body.id}`)
        .send({ status: "playing" });

      // Add another song - should start at position 1 since playing songs don't count for fairness
      const queuedRes = await request(app)
        .post("/api/box_songs")
        .send({ box_id: fairBoxId, song_id: songId2, user_id: fairUserId2 });

      expect(queuedRes.body.position).to.equal(1);
      expect(queuedRes.body.status).to.equal("queued");
    });
  });
});
