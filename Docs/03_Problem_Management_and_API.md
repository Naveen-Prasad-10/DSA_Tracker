# Module 3: Problem Management & REST API Layer

## 1. REST API Design Standard
The problem tracking system implements standard RESTful principles using the Flask Blueprint `problems_bp` registered on `/problems`.

### API Specifications Matrix

| Method | Route | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/problems` | Create problem | `{title, topic, difficulty, date_solved, confidence, custom_days?}` | `201 Created` (`{id, next_review}`) |
| **GET** | `/problems` | Fetch all user problems | None | `200 OK` (`[problem_objects]`) |
| **GET** | `/problems/today` | Fetch active due/overdue problems | None | `200 OK` (`[problem_objects]`) |
| **GET** | `/problems/upcoming` | Fetch active future problems | None | `200 OK` (`[problem_objects]`) |
| **PUT** | `/problems/<id>` | Update fields & recalculate schedule | Partial/Full JSON object | `200 OK` (`updated_object`) |
| **PATCH** | `/problems/<id>/done` | Toggle completion status (`is_done`) | None | `200 OK` (`{is_done: 0/1}`) |
| **DELETE** | `/problems/<id>` | Delete problem | None | `200 OK` (`{message, id}`) |

---

## 2. Core API Endpoint Implementation (`routes.py`)

### 2.1 Problem Creation & Dynamic Scheduling (`POST /problems`)
```python
@problems_bp.route("/problems", methods=["POST"])
@login_required
def add_problem():
    data = request.get_json()

    required = ["title", "topic", "difficulty", "date_solved", "confidence"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    title       = data["title"].strip()
    topic       = data["topic"].strip()
    difficulty  = data["difficulty"]
    date_solved = data["date_solved"]
    confidence  = int(data["confidence"])
    custom_days = int(data["custom_days"]) if data.get("custom_days") else None
    user_id     = session.get("user_id")

    if difficulty not in ("Easy", "Medium", "Hard"):
        return jsonify({"error": "difficulty must be Easy, Medium, or Hard"}), 400
    if not (1 <= confidence <= 5):
        return jsonify({"error": "confidence must be between 1 and 5"}), 400
    if custom_days is not None and custom_days < 1:
        return jsonify({"error": "custom_days must be a positive integer"}), 400

    next_review = calculate_next_review(confidence, custom_days=custom_days)

    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO problems (title, topic, difficulty, date_solved, confidence,
                                  next_review, custom_days, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (title, topic, difficulty, date_solved, confidence, next_review, custom_days, user_id)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Problem added successfully",
        "id": new_id,
        "next_review": next_review,
        "custom_days": custom_days,
    }), 201
```

### 2.2 Updating & Automatic Rescheduling (`PUT /problems/<id>`)
When confidence or custom days are modified, `calculate_next_review()` recalculates `next_review` automatically.

```python
@problems_bp.route("/problems/<int:problem_id>", methods=["PUT"])
@login_required
def update_problem(problem_id):
    user_id = session.get("user_id")
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    conn = get_db()
    row = conn.execute(
        "SELECT * FROM problems WHERE id = ? AND user_id = ?", (problem_id, user_id)
    ).fetchone()

    if row is None:
        conn.close()
        return jsonify({"error": "Problem not found"}), 404

    current = dict(row)
    title       = data.get("title", current["title"]).strip()
    topic       = data.get("topic", current["topic"]).strip()
    difficulty  = data.get("difficulty", current["difficulty"])
    date_solved = data.get("date_solved", current["date_solved"])
    confidence  = int(data.get("confidence", current["confidence"]))

    if "custom_days" in data:
        raw_cd = data["custom_days"]
        custom_days = int(raw_cd) if raw_cd and int(raw_cd) > 0 else None
    else:
        custom_days = current["custom_days"]

    next_review = calculate_next_review(confidence, custom_days=custom_days)

    conn.execute(
        """UPDATE problems
           SET title=?, topic=?, difficulty=?, date_solved=?,
               confidence=?, next_review=?, custom_days=?
           WHERE id=? AND user_id=?""",
        (title, topic, difficulty, date_solved, confidence, next_review, custom_days, problem_id, user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Problem updated", "id": problem_id, "next_review": next_review})
```

---

## 3. Frontend API Integration (`services/api.js` & React Views)

The frontend relies on a centralized Axios instance that routes requests to the Flask backend.

```javascript
// frontend/src/services/api.js
import axios from "axios";

const http = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

export const addProblem = (data) => http.post("/problems", data).then((r) => r.data);
export const getDueToday = () => http.get("/problems/today").then((r) => r.data);
export const updateProblem = (id, data) => http.put(`/problems/${id}`, data).then((r) => r.data);
export const toggleDone = (id) => http.patch(`/problems/${id}/done`).then((r) => r.data);
```

### UI Flow in `ProblemsPage.jsx`:
1. Renders 4 primary tab filters: `Due Today`, `Upcoming`, `Active`, `Done`.
2. Fetches problems via `Promise.all([getDueToday(), getUpcoming(), getProblems()])`.
3. Passes individual objects to `<ProblemCard />` components which offer inline editing, completion toggling, and deletion.
