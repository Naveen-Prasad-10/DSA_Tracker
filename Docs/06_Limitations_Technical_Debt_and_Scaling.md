# Module 6: Code Flaws, Technical Debt & Production Scaling Strategy

## 1. Identified Code Flaws & Critical Bugs

### Bug 1: Missing API Proxy Routes in Development (`vite.config.js`)
* **Location**: `frontend/vite.config.js`
* **Issue**: The proxy block only redirects `/problems` and `/analytics` to port 5000. It leaves out `/auth`, `/social`, and `/roadmap`.
* **Consequence**: Running the app via Vite dev server (`npm run dev`) causes login, social user searches, and roadmap operations to fail with HTTP `404 Not Found`.
* **Fix**: Update `vite.config.js` proxy settings:
```javascript
proxy: {
  "/problems":  { target: "http://localhost:5000", changeOrigin: true },
  "/analytics": { target: "http://localhost:5000", changeOrigin: true },
  "/auth":      { target: "http://localhost:5000", changeOrigin: true },
  "/social":    { target: "http://localhost:5000", changeOrigin: true },
  "/roadmap":   { target: "http://localhost:5000", changeOrigin: true },
}
```

---

### Bug 2: Multi-Tenant Data Leak in Background Worker (`scheduler.py`)
* **Location**: `scheduler.py` (Line 42)
* **Issue**: `fetch_upcoming_problems()` queries:
```sql
SELECT title, topic, difficulty, next_review FROM problems
WHERE next_review <= ? AND is_done = 0 ORDER BY next_review ASC
```
* **Consequence**: It ignores `user_id` segregation, bundling problems from **all users** into a single digest email sent to `CONFIG["recipient"]`.
* **Fix**: Update `fetch_upcoming_problems()` to join against the `users` table and send targeted emails per registered user address.

---

### Bug 3: Faulty Account Adoption Migration (`auth.py`)
* **Location**: `auth.py` (Lines 43–48)
* **Issue**: When a new user registers, the route checks `SELECT COUNT(*) FROM problems WHERE user_id IS NULL`. If `user_count == 1`, it updates all unassigned problems to belong to the new user.
* **Consequence**: If legacy data exists without a `user_id`, registering a user retroactively assigns ownership of unrelated problems to user #1.

---

## 2. Technical Debt Matrix

| Dimension | Hackathon / Current State | Production Standard Solution |
| :--- | :--- | :--- |
| **Database Engine** | SQLite file database (`tracker.db`) | Managed PostgreSQL with connection pooling |
| **Session Store** | Signed Client-Side Cookies | Server-Side Redis session store or OAuth2 JWT |
| **Database Migrations** | Imperative `try...except ALTER TABLE` | Declarative migrations using Alembic / Flask-Migrate |
| **Async Tasks** | Synchronous background CLI script (`scheduler.py`) | Celery / Redis Queue with Celery Beat scheduler |
| **Secrets Management** | Hardcoded default fallback strings in code | `.env` variables managed via AWS Secrets Manager |

---

## 3. Production Scaling Strategy (10x to 100x Usage)

```text
                                [ Nginx Load Balancer ]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌──────────────────────────┐                  ┌──────────────────────────┐
       │   Gunicorn Flask App 1   │                  │   Gunicorn Flask App 2   │
       └────────────┬─────────────┘                  └────────────┬─────────────┘
                    │                                             │
                    ├──────────────────────┬──────────────────────┤
                    ▼                      ▼                      ▼
        ┌──────────────────────┐ ┌───────────────────┐ ┌─────────────────────┐
        │  PostgreSQL Database │ │   Redis Server    │ │   Celery Workers    │
        │  (Primary + Replica) │ │(Sessions & Cache) │ │(Email & Notifications│
        └──────────────────────┘ └───────────────────┘ └─────────────────────┘
```

### Key Infrastructure Upgrades:
1. **Database Migration**: Switch from SQLite to PostgreSQL. SQLite locks the entire database file on write, creating a bottleneck. PostgreSQL supports row-level locking and concurrent read/writes.
2. **Horizontal App Scaling**: Run multiple stateless Gunicorn application worker processes behind an Nginx reverse proxy.
3. **Session & Cache Centralization**: Store Flask session keys in Redis so any app worker node can validate incoming user session cookies.
4. **Asynchronous Background Processing**: Offload daily email dispatching to Celery background workers backed by Redis.

---

## 4. Comprehensive Interview Question Bank

### 🔴 Tier 1 — Core Architectural Questions

#### Q1: Walk me through your database schema design.
* **Answer**: "The application centers around 4 relational tables in SQLite: `users`, `problems`, `friends`, and `roadmap_progress`. The `problems` table stores titles, topics, difficulty levels, solved dates, self-reported confidence (1-5), and computed `next_review` dates, indexed by `user_id`. The `friends` table acts as a bidirectional join table tracking friend request states (`pending`/`accepted`), while `roadmap_progress` uses a `UNIQUE(user_id, problem_id)` composite key constraint to track curriculum milestones."

#### Q2: How does your application prevent SQL Injection?
* **Answer**: "All raw SQL queries execute using Python's `sqlite3` parameter binding tuple syntax (`?`). User inputs are passed as separate argument tuples (e.g. `conn.execute('SELECT * FROM users WHERE username = ?', (username,))`). This separates SQL code compilation from data evaluation, ensuring input strings cannot modify query syntax."

---

### 🟡 Tier 2 — Operational & Security Questions

#### Q3: How do you handle password storage and session security?
* **Answer**: "Passwords are hashed using Werkzeug's `generate_password_hash()`, which applies cryptographic salting and key stretching (`scrypt` or `pbkdf2:sha256`). Sessions are stored using Flask's encrypted client cookies. Session fixation is mitigated by explicitly clearing existing session state (`session.clear()`) prior to saving user data upon login."

#### Q4: Explain a technical limitation of your current implementation and how you would fix it.
* **Answer**: "One current limitation is SQLite's database-level file lock on write operations. Under concurrent write requests, Flask threads throw lock contention errors. In a production version, I would replace SQLite with PostgreSQL using an Object-Relational Mapper (ORM) like SQLAlchemy with `pgBouncer` for database connection pooling."
