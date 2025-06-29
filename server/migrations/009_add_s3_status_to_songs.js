/**
 * Create a new table related to songs by youtube_id
 * Also make youtube_id unique in the songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add unique constraint to youtube_id in songs table
  await knex.schema.alterTable("songs", function (table) {
    table.unique("youtube_id");
  });

  // Create song_youtube_status table
  return knex.schema.createTable("song_youtube_status", function (table) {
    table.uuid("id").primary();
    table.string("youtube_id").notNullable();
    table
      .foreign("youtube_id")
      .references("youtube_id")
      .inTable("songs")
      .onDelete("CASCADE");
    table.unique(["youtube_id"]);
    table
      .enu("status", ["pending", "processing", "completed", "failed"])
      .defaultTo("pending");
    table.integer("retry_count").defaultTo(0);
    table.string("error_message").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

/**
 * Drop the song_youtube_status table and remove unique constraint from youtube_id in songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop the song_youtube_status table
  await knex.schema.dropTableIfExists("song_youtube_status");

  // Remove unique constraint from youtube_id in songs table
  await knex.schema.alterTable("songs", function (table) {
    table.dropUnique("youtube_id");
  });
}
