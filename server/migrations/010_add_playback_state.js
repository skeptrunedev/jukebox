exports.up = function(knex) {
  return knex.schema.createTable('box_playback_state', (table) => {
    table.uuid('id').primary();
    table.uuid('box_id').notNullable().references('id').inTable('boxes').onDelete('CASCADE');
    table.uuid('current_song_id').nullable().references('id').inTable('box_songs');
    table.uuid('leader_user_id').nullable().references('id').inTable('users');
    table.boolean('is_playing').defaultTo(false);
    table.float('playback_position').defaultTo(0);
    table.timestamp('position_updated_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['box_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('box_playback_state');
};