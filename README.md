# 🧠 DSA Revision Tracker — Spaced Repetition

A full-stack web application designed to track and revise coding problems using **spaced repetition** scheduling. The application features a clean, professional React (Vite) frontend with a Python (Flask) REST API and SQLite database.

---

## 📁 Project Structure

```text
coding-tracker/
├── app.py              # Flask entry point — initializes app & serves API
├── models.py           # SQLite schema (users, problems, friendships) & DB helpers
├── auth.py             # User authentication routes (login, register, logout)
├── routes.py           # Core REST API endpoints for problems
├── analytics.py        # Dashboard analytics (streaks, weak topics, over-time graphs)
├── roadmap.py          # 4-Week Interview Curriculum generation & tracking
├── social.py           # Friend system, leaderboards, and activity feeds
├── utils.py            # Scheduling logic (confidence → next review date)
├── scheduler.py        # Standalone script for daily email reminders
├── requirements.txt    # Python dependencies
├── tracker.db          # Auto-generated SQLite database
└── frontend/           # React 18 Single Page Application (Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/ # Reusable UI components (Navbar, ProblemCard, etc.)
        ├── pages/      # Route pages (Dashboard, Roadmap, Friends, etc.)
        ├── services/   # Axios API integrations
        ├── context/    # React Context (Auth)
        └── index.css   # Global design tokens (Pastel blue theme)
```

---

## 🚀 How to Run Locally

### 1. Start the Flask Backend
Open a terminal in the root directory:
```bash
# Create a virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate
# Activate it (macOS / Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```
*The backend runs on `http://127.0.0.1:5000`.*

### 2. Start the React Frontend
Open a **new terminal** and navigate to the `frontend` folder:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend runs on `http://localhost:5173`. Vite will automatically proxy API requests to Flask.*

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

This logic lives in **`utils.py → calculate_next_review(confidence)`**.

---

## 🔌 Core Features

*   **Spaced Repetition Tracker:** Log problems and automatically schedule them for future review based on your confidence score.
*   **Analytics Dashboard:** Visualizes your study streak, identifies weak topics, and charts problems solved over time.
*   **4-Week Curriculum Roadmap:** A structured interview preparation plan divided by topic with progress tracking.
*   **Social & Friends:** Add friends via a unique code, view leaderboards, and track your friends' recent activity.
*   **Authentication:** Secure user accounts with session-based authentication to keep your data private.

---

## 🗃️ Database Schema

The database uses SQLite with the following primary tables:

1. **`users`**: Manages authentication (`id`, `username`, `password_hash`, `friend_code`).
2. **`problems`**: Stores user-specific problems (`id`, `user_id`, `title`, `topic`, `difficulty`, `date_solved`, `confidence`, `next_review`, `is_done`).
3. **`friendships`**: Tracks connections between users (`user_id_1`, `user_id_2`).

---

## 📧 Email Reminders (Optional)

`scheduler.py` fetches today's due problems and sends a summary email via SMTP.

**Setup Environment Variables:**
```bash
# Windows (PowerShell)
$env:EMAIL_SENDER   = "you@gmail.com"
$env:EMAIL_PASSWORD = "your_app_password"
$env:EMAIL_RECIPIENT = "you@gmail.com"
```

Run the script daily via Task Scheduler (Windows) or Cron (Linux/macOS):
```bash
python scheduler.py
```
