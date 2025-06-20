/**
 * Add YouTube support: youtube_id and youtube_url fields to songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("songs", function (table) {
    table.string("youtube_id").nullable();
    table.string("youtube_url").nullable();
    table.integer("duration").nullable();
    table.string("thumbnail_url").nullable();
  });
}

/**
 * Remove YouTube support fields from songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("songs", function (table) {
    table.dropColumn("youtube_id");
    table.dropColumn("youtube_url");
    table.dropColumn("duration");
    table.dropColumn("thumbnail_url");
  });
}
