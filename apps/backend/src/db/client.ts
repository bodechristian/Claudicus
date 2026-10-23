import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { INIT_MIGRATION_SQL } from "./migrations/0001_init.js";

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db: Database.Database = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

// Run at module load, not as a separately-called export: repository modules
// `db.prepare()` their statements at import time, which (per ES module
// evaluation order) happens before any of index.ts's own top-level code runs.
// Migrations must therefore complete here, before this module finishes
// initializing, so every table exists by the time a repository imports `db`.
db.exec(INIT_MIGRATION_SQL);
