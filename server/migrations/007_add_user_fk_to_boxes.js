/**
 * Add user_id foreign key to boxes table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('boxes', function(table) {
    table.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
  });
}

/**
 * Remove user_id foreign key from boxes table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('boxes', function(table) {
    table.dropColumn('user_id');
  });
}