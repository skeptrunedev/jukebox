import path from 'path';

import BetterSqlite3 from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { Database } from './types/db';

const sqlite = new BetterSqlite3(
  path.resolve(__dirname, '../dev.sqlite3')
);

const db = new Kysely<Database>({
  dialect: new SqliteDialect({ database: sqlite })
});

export default db;