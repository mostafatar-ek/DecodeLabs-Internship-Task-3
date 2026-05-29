/*
 * PILLAR 3: THE ACTION — CRUD & RESTful HTTP
 *
 * CREATE → POST   → SQL INSERT
 * READ   → GET    → SQL SELECT
 * UPDATE → PUT    → SQL UPDATE
 * DELETE → DELETE → SQL DELETE
 *
 * PILLAR 4: THE SHIELD — all queries use parameterized statements
 * to prevent SQL injection attacks.
 */

const express = require("express");
const router = express.Router();
const db = require("../db/database");

// ──────────────────────────────────────────────
// CREATE — POST /api/users
// ──────────────────────────────────────────────
router.post("/", (req, res, next) => {
  const { name, email, age } = req.body;

  if (!name || !email || age === undefined) {
    return res.status(400).json({ error: "name, email, and age are required." });
  }

  try {
    // Parameterized query — values are NEVER concatenated into the SQL string
    const stmt = db.prepare(
      "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
    );
    const result = stmt.run(name, email, age);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ message: "User created.", data: user });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// READ ALL — GET /api/users
// ──────────────────────────────────────────────
router.get("/", (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  res.json({ count: users.length, data: users });
});

// ──────────────────────────────────────────────
// READ ONE — GET /api/users/:id
// ──────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found." });

  const profile = db
    .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
    .get(Number(req.params.id));

  res.json({ data: { ...user, profile: profile || null } });
});

// ──────────────────────────────────────────────
// UPDATE — PUT /api/users/:id
// ──────────────────────────────────────────────
router.put("/:id", (req, res, next) => {
  const { name, email, age } = req.body;

  if (!name || !email || age === undefined) {
    return res.status(400).json({ error: "name, email, and age are required." });
  }

  try {
    const stmt = db.prepare(
      "UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?"
    );
    const result = stmt.run(name, email, age, Number(req.params.id));

    if (result.changes === 0) return res.status(404).json({ error: "User not found." });

    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
    res.json({ message: "User updated.", data: updated });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE — DELETE /api/users/:id
// ──────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: "User not found." });
  res.json({ message: "User deleted." });
});

// ──────────────────────────────────────────────
// CREATE / UPDATE 1:1 PROFILE — PUT /api/users/:id/profile
// ──────────────────────────────────────────────
router.put("/:id/profile", (req, res, next) => {
  const { bio, website } = req.body;
  const userId = Number(req.params.id);

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  try {
    db.prepare(`
      INSERT INTO user_profiles (user_id, bio, website)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, website = excluded.website
    `).run(userId, bio || null, website || null);

    const profile = db.prepare("SELECT * FROM user_profiles WHERE user_id = ?").get(userId);
    res.json({ message: "Profile saved.", data: profile });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
