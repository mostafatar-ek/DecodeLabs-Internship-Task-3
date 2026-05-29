const db = require("./database");

/*
 * PILLAR 1: THE BLUEPRINT — Schema & Design
 *
 * Relationships demonstrated:
 *  - Users  <-> UserProfiles  : One-to-One  (1:1)
 *  - Users  <-> Posts         : One-to-Many (1:Many)
 *  - Posts  <-> Tags          : Many-to-Many via post_tags junction table (M:M)
 *
 * Constraints (PILLAR 4: THE SHIELD — Integrity & Security):
 *  - PRIMARY KEY  : unique identifier per row
 *  - NOT NULL     : critical fields cannot be empty
 *  - UNIQUE       : prevents duplicate emails/usernames
 *  - CHECK        : enforces logical data rules (e.g. age >= 18)
 *  - FOREIGN KEY  : referential integrity between tables
 */

function initializeSchema() {
  db.exec(`
    -- ─────────────────────────────────────────────
    -- TABLE: users
    -- ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      age        INTEGER NOT NULL CHECK (age >= 18),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────────
    -- TABLE: user_profiles  (1:1 with users)
    -- ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS user_profiles (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      bio     TEXT,
      website TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ─────────────────────────────────────────────
    -- TABLE: posts  (1:Many — one user, many posts)
    -- ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      content    TEXT    NOT NULL,
      user_id    INTEGER NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ─────────────────────────────────────────────
    -- TABLE: tags  (Many-to-Many with posts)
    -- ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    -- Junction table for M:M relationship
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL,
      tag_id  INTEGER NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
    );
  `);

  console.log("Database schema initialized successfully.");
}

module.exports = { initializeSchema };
