const express = require("express");
const app = express();

app.use(express.json());

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));

// API overview
app.get("/", (req, res) => {
  res.json({
    project: "DecodeLabs Project 3 — Database Integration",
    pillars: {
      "1_blueprint": "Schema with users, user_profiles, posts, tags, post_tags",
      "2_bridge": "SQLite via better-sqlite3 (native driver)",
      "3_action": "Full CRUD mapped to RESTful HTTP verbs",
      "4_shield": "Parameterized queries + NOT NULL + UNIQUE + CHECK + FOREIGN KEY constraints",
    },
    endpoints: {
      users: {
        "POST   /api/users": "Create a user",
        "GET    /api/users": "List all users",
        "GET    /api/users/:id": "Get user + profile",
        "PUT    /api/users/:id": "Update a user",
        "DELETE /api/users/:id": "Delete a user",
        "PUT    /api/users/:id/profile": "Create or update 1:1 profile",
      },
      posts: {
        "POST   /api/posts": "Create a post (with optional tags)",
        "GET    /api/posts": "List all posts with author + tags",
        "GET    /api/posts/:id": "Get a single post",
        "PUT    /api/posts/:id": "Update a post",
        "DELETE /api/posts/:id": "Delete a post",
        "GET    /api/posts/tags/all": "List all tags",
      },
    },
  });
});

// Error handler must be last
app.use(require("./middleware/errorHandler"));

module.exports = app;
