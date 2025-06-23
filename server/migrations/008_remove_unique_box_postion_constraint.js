/**
 * Remove unique constraint on box_id and position from box_songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("box_songs", function (table) {
    table.dropUnique(["box_id", "position"]);
  });
}

/**
 * Add back unique constraint on box_id and position to box_songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("box_songs", function (table) {
    table.unique(["box_id", "position"]);
  });
}
