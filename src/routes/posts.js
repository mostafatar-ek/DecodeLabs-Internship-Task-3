const express = require("express");
const router = express.Router();
const db = require("../db/database");

// ──────────────────────────────────────────────
// READ ALL TAGS — GET /api/posts/tags/all
// Must be declared before /:id to avoid route conflict
// ──────────────────────────────────────────────
router.get("/tags/all", (req, res) => {
  const tags = db.prepare("SELECT * FROM tags ORDER BY name").all();
  res.json({ count: tags.length, data: tags });
});

// ──────────────────────────────────────────────
// CREATE — POST /api/posts
// ──────────────────────────────────────────────
router.post("/", (req, res, next) => {
  const { title, content, user_id, tags } = req.body;

  if (!title || !content || !user_id) {
    return res.status(400).json({ error: "title, content, and user_id are required." });
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(Number(user_id));
  if (!user) return res.status(404).json({ error: "User not found." });

  try {
    const insertPost = db.prepare(
      "INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)"
    );
    const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
    const getTag = db.prepare("SELECT id FROM tags WHERE name = ?");
    const linkTag = db.prepare(
      "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)"
    );

    // Use a transaction so post + tags are written atomically
    let postId;
    const createPost = db.prepare("BEGIN");
    try {
      db.exec("BEGIN");
      const result = insertPost.run(title, content, Number(user_id));
      postId = result.lastInsertRowid;

      if (Array.isArray(tags) && tags.length > 0) {
        for (const tagName of tags) {
          const normalized = tagName.toLowerCase().trim();
          insertTag.run(normalized);
          const tag = getTag.get(normalized);
          linkTag.run(postId, tag.id);
        }
      }
      db.exec("COMMIT");
    } catch (txErr) {
      db.exec("ROLLBACK");
      throw txErr;
    }

    const post = getPostWithTags(postId);
    res.status(201).json({ message: "Post created.", data: post });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// READ ALL — GET /api/posts
// ──────────────────────────────────────────────
router.get("/", (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.name AS author_name
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  const result = posts.map((p) => ({ ...p, tags: getTagsForPost(p.id) }));
  res.json({ count: result.length, data: result });
});

// ──────────────────────────────────────────────
// READ ONE — GET /api/posts/:id
// ──────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const post = getPostWithTags(Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found." });
  res.json({ data: post });
});

// ──────────────────────────────────────────────
// UPDATE — PUT /api/posts/:id
// ──────────────────────────────────────────────
router.put("/:id", (req, res, next) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required." });
  }

  try {
    const result = db
      .prepare("UPDATE posts SET title = ?, content = ? WHERE id = ?")
      .run(title, content, Number(req.params.id));

    if (result.changes === 0) return res.status(404).json({ error: "Post not found." });

    const updated = getPostWithTags(Number(req.params.id));
    res.json({ message: "Post updated.", data: updated });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE — DELETE /api/posts/:id
// ──────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: "Post not found." });
  res.json({ message: "Post deleted." });
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getTagsForPost(postId) {
  return db.prepare(`
    SELECT t.id, t.name
    FROM tags t
    JOIN post_tags pt ON t.id = pt.tag_id
    WHERE pt.post_id = ?
  `).all(postId);
}

function getPostWithTags(postId) {
  const post = db.prepare(`
    SELECT p.*, u.name AS author_name
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(postId);

  if (!post) return null;
  return { ...post, tags: getTagsForPost(postId) };
}

module.exports = router;
