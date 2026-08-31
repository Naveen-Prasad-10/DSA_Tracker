# Module 1: Core Architecture, Database & Spaced Repetition Engine

## 1. Problem Domain: The Cognitive Forgetting Curve
Human memory retention decays exponentially over time (Hermann Ebbinghaus Forgetting Curve). Without active recall and scheduled repetition, over 70% of newly learned DSA problem solutions are forgotten within 24–48 hours. 

The **DSA Revision Tracker** solves this problem by using **spaced repetition**: expanding review intervals based on user mastery (self-reported confidence score 1–5).

---

## 2. Spaced Repetition Implementation (`utils.py`)

### 2.1 Interval Calculation Logic
The calculation logic is pure, deterministic, and isolated in `utils.py`.

```python
from datetime import date, timedelta

# Default confidence → days mapping
CONFIDENCE_INTERVALS = {
    1: 1,   # Low confidence  → review tomorrow (1 day)
    2: 2,   # Barely recalled → review in 2 days
    3: 4,   # Got it with help → review in 4 days
    4: 7,   # Good recall      → review in 1 week (7 days)
    5: 14,  # High confidence → review in 2 weeks (14 days)
}

def calculate_next_review(confidence: int, from_date: date = None, custom_days: int = None) -> str:
    if from_date is None:
        from_date = date.today()

    if custom_days is not None and custom_days > 0:
        interval_days = custom_days
    else:
        interval_days = CONFIDENCE_INTERVALS.get(confidence, 1)

    next_review = from_date + timedelta(days=interval_days)
    return next_review.isoformat()
```

### 2.2 Mathematical Formula & Execution
$$\text{Next Review Date} = \text{Current Date} + \Delta t(\text{confidence})$$
Where:
$$\Delta t(\text{confidence}) = \begin{cases} 
\text{custom\_days} & \text{if } \text{custom\_days} > 0 \\
1 & \text{if } \text{confidence} = 1 \\
2 & \text{if } \text{confidence} = 2 \\
4 & \text{if } \text{confidence} = 3 \\
7 & \text{if } \text{confidence} = 4 \\
14 & \text{if } \text{confidence} = 5 
\end{cases}$$

---

## 3. Database Schema & Persistence Layer (`models.py`)

The application uses SQLite (`tracker.db`) for lightweight local persistence. Connections use `sqlite3.Row` so query results behave like Python dictionaries.

```python
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "tracker.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Dict-like row access
    return conn
```

### 3.1 Relational Schema Diagram

```text
  ┌─────────────────────────┐         ┌─────────────────────────────────┐
  │         users           │         │            problems             │
  ├─────────────────────────┤         ├─────────────────────────────────┤
  │ PK  id           INT    │ ◄──┐    │ PK  id           INT            │
  │     username     TEXT   │    │    │     title        TEXT           │
  │     password_hash TEXT  │    │    │     topic        TEXT           │
  │     created_at   TEXT   │    │    │     difficulty   TEXT           │
  └─────────────────────────┘    │    │     date_solved  TEXT (ISO)     │
                                 │    │     confidence   INT (1-5)      │
                                 ├────┼─FK  user_id     INT            │
  ┌─────────────────────────┐    │    │     next_review  TEXT (ISO)     │
  │     friends             │    │    │     custom_days  INT            │
  ├─────────────────────────┤    │    │     is_done      INT (0/1)      │
  │ PK  user_id      INT ───┼────┘    └─────────────────────────────────┘
  │ PK  friend_id    INT    │
  │     status       TEXT   │         ┌─────────────────────────────────┐
  └─────────────────────────┘         │        roadmap_progress         │
                                      ├─────────────────────────────────┤
                                      │ PK  id           INT            │
                                      │ FK  user_id      INT            │
                                      │     problem_id   TEXT           │
                                      │     completed_at TEXT           │
                                      │ UNIQUE(user_id, problem_id)     │
                                      └─────────────────────────────────┘
```

---

## 4. Application Entry & Production Server Strategy (`app.py`)

`app.py` bootstraps the Flask application, registers modular Blueprints, and handles Single-Page Application (SPA) routing for React.

```python
from flask import Flask
from models import init_db
from routes import problems_bp
from analytics import analytics_bp
from auth import auth_bp
from roadmap import roadmap_bp
from social import social_bp

app = Flask(__name__, static_folder="frontend/dist", static_url_path="/")
app.secret_key = os.environ.get("SECRET_KEY", "coding-tracker-super-secret-key-123")

# Initialize database tables
init_db()

# Register Blueprints
app.register_blueprint(problems_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(roadmap_bp)
app.register_blueprint(social_bp)

# SPA Catch-all Handler for React Router
@app.errorhandler(404)
def not_found(e):
    return app.send_static_file("index.html")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    return app.send_static_file("index.html")
```

---

## 5. Interview Defense Q&A: Core Architecture

### Q1: Why separation into pure functions in `utils.py` vs putting logic directly in Flask routes?
* **Answer**: "Separating interval math into `utils.py` adheres to the **Single Responsibility Principle** and makes the core logic modular and unit-testable. Routes are responsible for request handling and validation, while `utils.py` handles business math without any dependency on HTTP or database connections."

### Q2: How does the application serve both API endpoints and React UI in production?
* **Answer**: "In production (`python app.py`), Flask serves the compiled static files output by Vite (`frontend/dist`). Non-API client routing requests (e.g. `/dashboard` or `/roadmap`) trigger Flask's `@app.route('/<path:path>')` catch-all route, which serves `index.html`. Client-side React Router then reads the URL path and renders the appropriate page component without page reloads."
