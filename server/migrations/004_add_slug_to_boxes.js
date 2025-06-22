/**
 * Add slug column to boxes table for pretty URL slugs
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("boxes", function (table) {
    table
      .string("slug")
      .notNullable()
      .unique()
      .defaultTo(
        knex.raw(
          "(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))))"
        )
      );
  });
}

/**
 * Remove slug column from boxes table
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("boxes", function (table) {
    table.dropColumn("slug");
  });
}
