# Code Review Tracker — Spaced Repetition

A lightweight, full-stack web app to track and revise coding problems using **spaced repetition** scheduling. Built with Python (Flask), SQLite, and vanilla HTML/CSS/JS.

---

## 📁 File Structure

```
coding-tracker/
├── app.py           # Flask entry point — initializes app & DB
├── models.py        # SQLite schema & connection helper
├── routes.py        # REST API endpoints (Blueprint)
├── utils.py         # Scheduling logic (confidence → next review date)
├── scheduler.py     # Phase 2: daily email reminder script
├── requirements.txt # Python dependencies (Flask only)
├── tracker.db       # Auto-generated SQLite database
└── static/
    ├── index.html   # Single-page frontend
    ├── style.css    # Dark-mode styling
    └── app.js       # API calls, form logic, modal, rendering
```

---

## 🚀 How to Run Locally

### 1. Create a virtual environment (recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the server
```bash
python app.py
```

### 4. Open the app
Navigate to **http://127.0.0.1:5000** in your browser.

---

## ⚙️ How Scheduling Works

When you add or revise a problem, you rate your confidence from **1 to 5**. The app calculates the next review date:

| Confidence | Meaning          | Next Review |
|:----------:|:-----------------|:-----------:|
| 1          | Completely forgot| 1 day       |
| 2          | Barely recalled  | 2 days      |
| 3          | Got it with help | 4 days      |
| 4          | Got it, slow     | 7 days      |
| 5          | Nailed it!       | 14 days     |

This logic lives in **`utils.py → calculate_next_review(confidence)`** and is called by both the add and update routes.

---

## 🔌 REST API

| Method | Endpoint              | Description                          |
|:------:|:----------------------|:-------------------------------------|
| POST   | `/problems`           | Add a new problem                    |
| GET    | `/problems`           | Get all problems                     |
| GET    | `/problems/today`     | Get problems due today (or overdue)  |
| GET    | `/problems/upcoming`  | Get future scheduled problems        |
| PUT    | `/problems/<id>`      | Update confidence & reschedule       |

### POST `/problems` — example body
```json
{
  "title":       "Two Sum",
  "topic":       "Arrays, HashMap",
  "difficulty":  "Easy",
  "date_solved": "2024-01-15",
  "confidence":  3
}
```

---

## 📧 Phase 2 — Email Reminders

`scheduler.py` fetches today's due problems and sends a summary email via SMTP.

### Setup
Set environment variables before running:
```bash
# Windows (PowerShell)
$env:EMAIL_SENDER   = "you@gmail.com"
$env:EMAIL_PASSWORD = "your_app_password"
$env:EMAIL_RECIPIENT = "you@gmail.com"

python scheduler.py
```

> **Gmail tip:** Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your real password.

### Automate it
- **Windows:** Use *Task Scheduler* to run `python scheduler.py` daily.
- **Linux/macOS:** Add a cron job: `0 9 * * * python /path/to/scheduler.py`

---

## 🧩 Component Overview

| File | Role |
|:-----|:-----|
| `app.py` | Bootstraps Flask, registers routes, serves frontend |
| `models.py` | Defines the `problems` table schema, provides `get_db()` |
| `routes.py` | Implements all REST endpoints, validates inputs |
| `utils.py` | Pure-function scheduling logic (`calculate_next_review`) |
| `scheduler.py` | Standalone script for daily email reminders |
| `static/app.js` | Fetches API data, handles form submit, renders cards, modal |
| `static/style.css` | Dark-themed, responsive UI |

---

## 🗃️ Database Schema

```sql
CREATE TABLE problems (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    topic       TEXT    NOT NULL,
    difficulty  TEXT    NOT NULL CHECK(difficulty IN ('Easy','Medium','Hard')),
    date_solved TEXT    NOT NULL,
    confidence  INTEGER NOT NULL CHECK(confidence BETWEEN 1 AND 5),
    next_review TEXT    NOT NULL
);
```
