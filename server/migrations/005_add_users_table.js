/**
 * Add users table for storing id, fingerprint, and username.
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary();
    table.string('fingerprint').notNullable().unique();
    table.string('username').notNullable();
  });
}

/**
 * Drop users table.
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('users');
}