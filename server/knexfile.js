/** @type {import('knex').Knex.Config} */
export const development = {
  client: "sqlite3",
  connection: {
    filename: "./dev.sqlite3",
  },
  migrations: {
    directory: "./migrations",
  },
  useNullAsDefault: true,
};
