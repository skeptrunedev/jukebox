import path from 'path';

/** @type {import('knex').Knex.Config} */
const dbFile = process.env.DB_FILE || path.resolve(__dirname, 'dev.sqlite3');
export const development = {
  client: "sqlite3",
  connection: {
    filename: dbFile,
  },
  migrations: {
    directory: "./migrations",
  },
  useNullAsDefault: true,
};
