/**
 * Add slug column to boxes table for pretty URL slugs
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('boxes', function(table) {
    table.string('slug').notNullable().unique();
  });
}

/**
 * Remove slug column from boxes table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('boxes', function(table) {
    table.dropColumn('slug');
  });
}