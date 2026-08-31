# Module 5: Social Networking & Curriculum Roadmap Systems

## 1. Overview
The platform includes peer accountability and structured learning features:
1. **Curriculum Roadmap**: A 4-week interview prep plan tracking individual problem completion status across topics.
2. **Social Network**: User discovery, bidirectional friend requests, and public progress profiles.

---

## 2. Curriculum Roadmap Engine (`roadmap.py` & `RoadmapPage.jsx`)

### 2.1 Progress Persistence (`roadmap_progress` Table)
Progress is saved in `roadmap_progress`:
* `user_id`: Foreign Key referencing `users(id)`.
* `problem_id`: Text ID matching curriculum items (e.g. `"lc-1"`).
* `completed_at`: ISO timestamp.
* Constraint: `UNIQUE(user_id, problem_id)`.

### 2.2 Offline Syncing (`POST /roadmap/progress/sync`)
Allows syncing local unauthenticated problem checks saved in browser `localStorage` once the user logs in:

```python
@roadmap_bp.route("/progress/sync", methods=["POST"])
@login_required
def sync_progress():
    data = request.get_json()
    completed_ids = data.get("completed_ids", [])
    user_id = session.get("user_id")
    completed_at = datetime.utcnow().isoformat()
    
    conn = get_db()
    for pid in completed_ids:
        conn.execute(
            """INSERT INTO roadmap_progress (user_id, problem_id, completed_at) 
               VALUES (?, ?, ?) 
               ON CONFLICT(user_id, problem_id) DO NOTHING""",
            (user_id, str(pid), completed_at)
        )
    conn.commit()
    conn.close()
    return jsonify({"message": "Progress synced successfully"})
```

---

## 3. Social Network Architecture (`social.py`)

### 3.1 Friend State Machine
Friendships are stored in `friends (user_id, friend_id, status)` where `status` is `'pending'` or `'accepted'`.

```text
               Send Friend Request
[ User A ] ───────────────────────────► [ User B ] (Status: 'pending')
    │                                         │
    │      Accept Request / Auto-Accept       │
    └─────────────────────────────────────────┼─► (Status: 'accepted' for both directions)
```

### 3.2 Mutual Auto-Accept Logic (`POST /social/request/<friend_id>`)
If User A sends a request to User B while a pending request already exists from User B to User A, the system auto-promotes the friendship status to `'accepted'`:

```python
reverse = conn.execute(
    "SELECT status FROM friends WHERE user_id = ? AND friend_id = ?",
    (friend_id, user_id)
).fetchone()

if reverse and reverse["status"] == "pending":
    conn.execute("UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?", (friend_id, user_id))
    conn.execute("INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')", (user_id, friend_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Friend request accepted"})
```

### 3.3 Privacy & Public Profiles (`GET /social/profile/<friend_id>`)
Users can view detailed statistics of another user (solved counts, streak, difficulty distribution, recent problems) **only if** an accepted friendship exists or if viewing their own profile:

```python
if user_id != friend_id:
    status = conn.execute(
        "SELECT status FROM friends WHERE user_id = ? AND friend_id = ?",
        (user_id, friend_id)
    ).fetchone()
    
    if not status or status["status"] != "accepted":
        conn.close()
        return jsonify({"error": "Profile is private"}), 403
```
