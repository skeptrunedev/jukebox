/**
 * Add user_id foreign key to box_songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('box_songs', function(table) {
    table.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
  });
}

/**
 * Remove user_id foreign key from box_songs table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('box_songs', function(table) {
    table.dropColumn('user_id');
  });
}