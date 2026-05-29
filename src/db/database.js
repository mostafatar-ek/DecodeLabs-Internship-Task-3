// Node.js 22.5+ built-in SQLite — no native compilation required
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH || "./data/database.db";
const resolvedPath = path.resolve(dbPath);
const dbDir = path.dirname(resolvedPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(resolvedPath);

// Enable WAL mode for better concurrency and foreign key enforcement
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

module.exports = db;
