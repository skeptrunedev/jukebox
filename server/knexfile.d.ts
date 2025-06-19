import type { Knex } from "knex";

declare const config: { [env: string]: Knex.Config };
export default config;