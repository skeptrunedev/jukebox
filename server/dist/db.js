"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const kysely_1 = require("kysely");
const sqlite = new better_sqlite3_1.default(path_1.default.resolve(__dirname, '../dev.sqlite3'));
const db = new kysely_1.Kysely({
    dialect: new kysely_1.SqliteDialect({ database: sqlite })
});
exports.default = db;
