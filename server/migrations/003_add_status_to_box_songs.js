/**
 * Add status column to box_songs table for tracking play status
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('box_songs', function(table) {
    table.enu('status', ['queued', 'playing', 'played']).notNullable().defaultTo('queued');
  });
}

/**
 * Remove status column from box_songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('box_songs', function(table) {
    table.dropColumn('status');
  });
}