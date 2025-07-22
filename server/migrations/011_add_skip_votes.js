exports.up = function(knex) {
  return knex.schema.createTable('skip_votes', (table) => {
    table.uuid('id').primary();
    table.uuid('box_id').notNullable().references('id').inTable('boxes').onDelete('CASCADE');
    table.uuid('song_id').notNullable().references('id').inTable('box_songs').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['box_id', 'song_id', 'user_id']);
    table.index(['box_id', 'song_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('skip_votes');
};