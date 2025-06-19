import Knex from "knex";
import knexConfig from "../../knexfile";

/**
 * Run migrations: reset all migrations and reapply.
 * Returns the Knex instance for cleanup.
 */
export async function migrateDb(): Promise<Knex.Knex> {
  const config = (knexConfig as any).development;
  const knex = Knex(config);
  await knex.migrate.rollback(undefined, true);
  await knex.migrate.latest();
  return knex;
}
