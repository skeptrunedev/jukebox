/**
 * Initial schema: boxes, songs, and box_songs tables.
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .createTable('boxes', function(table) {
      table.uuid('id').primary();
      table.string('name').notNullable();
    })
    .createTable('songs', function(table) {
      table.uuid('id').primary();
      table.string('title').notNullable();
      table.string('artist');
    })
    .createTable('box_songs', function(table) {
      table.uuid('id').primary();
      table.uuid('box_id').notNullable()
        .references('id').inTable('boxes').onDelete('CASCADE');
      table.uuid('song_id').notNullable()
        .references('id').inTable('songs').onDelete('CASCADE');
      table.integer('position').notNullable();
      table.unique(['box_id', 'position']);
      table.unique(['box_id', 'song_id']);
    });
}

/**
 * Drop boxes, songs, and box_songs tables.
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .dropTableIfExists('box_songs')
    .dropTableIfExists('songs')
    .dropTableIfExists('boxes');
}