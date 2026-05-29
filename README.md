# Project 3: Database Integration

**DecodeLabs Industrial Training Kit — Batch 2026**

A RESTful backend API that connects to a database to store and retrieve data permanently. Covers schema design, CRUD operations, relational data modeling, and security best practices.

---

## Tech Stack

- **Runtime:** Node.js 24 (built-in `node:sqlite` — no native compilation required)
- **Framework:** Express.js
- **Database:** SQLite (file-based SQL, zero server setup)

---

## The Four Pillars

| Pillar | Concept | Implementation |
|--------|---------|----------------|
| Blueprint | Schema & Design | 5 tables with PK, UNIQUE, NOT NULL, CHECK, FK constraints |
| Bridge | Integration & Connection | `node:sqlite` native driver connecting app to DB file |
| Action | CRUD & RESTful HTTP | POST / GET / PUT / DELETE mapped to INSERT / SELECT / UPDATE / DELETE |
| Shield | Integrity & Security | Parameterized queries + schema-level constraints |

---

## Database Schema

```
users (1) ──────────── (1) user_profiles     One-to-One
users (1) ──────────── (∞) posts             One-to-Many
posts (∞) ── post_tags ── (∞) tags           Many-to-Many
```

### Tables

**users**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| age | INTEGER | NOT NULL, CHECK (age >= 18) |
| created_at | TEXT | DEFAULT datetime('now') |

**user_profiles** (1:1 with users)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | NOT NULL, UNIQUE, FK → users |
| bio | TEXT | |
| website | TEXT | |

**posts** (1:Many with users)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| user_id | INTEGER | NOT NULL, FK → users |
| created_at | TEXT | DEFAULT datetime('now') |

**tags + post_tags** (Many-to-Many junction)

---

## Project Structure

```
├── src/
│   ├── server.js              # Entry point
│   ├── app.js                 # Express app + route mounting
│   ├── db/
│   │   ├── database.js        # DB connection (WAL mode, foreign keys ON)
│   │   └── schema.js          # Table definitions
│   ├── routes/
│   │   ├── users.js           # User CRUD + 1:1 profile
│   │   └── posts.js           # Post CRUD + M:M tags
│   └── middleware/
│       └── errorHandler.js    # Constraint error → HTTP status mapping
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start the server
npm start

# Development (auto-reload)
npm run dev
```

Server runs at `http://localhost:3000`

---

## API Reference

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a user |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user + their profile |
| PUT | `/api/users/:id` | Update a user |
| DELETE | `/api/users/:id` | Delete a user |
| PUT | `/api/users/:id/profile` | Create or update 1:1 profile |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a post (with optional tags) |
| GET | `/api/posts` | List all posts with author + tags |
| GET | `/api/posts/:id` | Get a single post |
| PUT | `/api/posts/:id` | Update a post |
| DELETE | `/api/posts/:id` | Delete a post |
| GET | `/api/posts/tags/all` | List all tags |

---

## Example Requests

**Create a user**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "age": 25}'
```

**Create a post with tags**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello World!", "user_id": 1, "tags": ["tech", "nodejs"]}'
```

**Update a user's profile (1:1 relationship)**
```bash
curl -X PUT http://localhost:3000/api/users/1/profile \
  -H "Content-Type: application/json" \
  -d '{"bio": "Full Stack Dev", "website": "https://example.com"}'
```

---

## Data Integrity Responses

| Violation | HTTP Status | Example |
|-----------|-------------|---------|
| Duplicate email | 409 Conflict | Email already registered |
| Age under 18 | 400 Bad Request | CHECK constraint failed |
| Missing required field | 400 Bad Request | NOT NULL constraint failed |
| Invalid foreign key | 400 Bad Request | User not found |
| Resource not found | 404 Not Found | User/Post does not exist |

---

## Security

All database queries use **parameterized statements** — user input is never concatenated into SQL strings, eliminating SQL injection attacks.

```js
// Vulnerable (never do this)
`SELECT * FROM users WHERE email = '${userInput}'`

// Safe (always do this)
db.prepare("SELECT * FROM users WHERE email = ?").get(userInput)
```
