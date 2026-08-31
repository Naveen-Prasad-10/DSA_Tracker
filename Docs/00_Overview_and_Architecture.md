# Module 0: System Overview & Architecture Map

## 1. Executive Summary & One-Sentence Pitch
**DSA Revision Tracker** is a full-stack web application that helps software engineers systematically master and retain Data Structures and Algorithms (DSA) using an adaptive **Spaced Repetition Algorithm**, interactive analytics, a 4-week interview roadmap, and peer social tracking.

---

## 2. High-Level Architecture & Dependency Map

### 2.1 System Architecture
```text
                                [ Web Browser / User ]
                                          │
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │   React 18 Single Page Application (Vite)    │
                   │   Context API, React Router, Recharts UI     │
                   └──────────────────────┬───────────────────────┘
                                          │  HTTP Requests (Axios / JSON)
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │             Flask Python Server              │
                   │  WSGI Entry (`app.py`), Static Dist Serving  │
                   └──────┬───────────────┬───────────────┬───────┘
                          │               │               │
        ┌─────────────────┴─┐   ┌─────────┴─────────┐   ┌─┴─────────────────┐
        │  Authentication   │   │ Business Modules  │   │ Scheduling Engine │
        │   `auth.py`       │   │`problems`, `social│   │   `utils.py`      │
        │ (Session Cookies) │   │ `analytics`,`road`│   │(Confidence Math)  │
        └────────┬──────────┘   └─────────┬─────────┘   └───────────────────┘
                 │                        │
                 └───────────┬────────────┘
                             ▼
               ┌───────────────────────────┐         ┌─────────────────────────┐
               │    SQLite Database        │ ◀────── │ Background Scheduler    │
               │   (`tracker.db`)          │         │ `scheduler.py` (SMTP)   │
               │ users, problems, friends, │         │ (Daily Email Reminders) │
               │     roadmap_progress      │         └─────────────────────────┘
               └───────────────────────────┘
```

### 2.2 Mental Dependency Flow
```text
User Action (UI)
 ↓
React Component (State / Effect)
 ↓
Axios API Helper (services/api.js)
 ↓
Flask Blueprint Route (e.g., routes.py / analytics.py / auth.py)
 ↓
Authentication Guard (@login_required in auth.py)
 ↓
Business / Algorithm Logic (utils.py)
 ↓
SQLite Database Query via Helper (models.py -> get_db())
 ↓
JSON Response back to React UI
```

---

## 3. Technology Inventory & Categorization

| Technology | Scope / File | Purpose in Project | Alternative Technologies | Interview Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Python / Flask** | Backend (`app.py`, Blueprints) | Lightweight WSGI server for routing and REST endpoints | FastAPI, Django, Express.js | 🔴 **Must Know** |
| **SQLite3** | Storage (`models.py`, `tracker.db`) | Serverless file-based relational database | PostgreSQL, MySQL, MongoDB | 🔴 **Must Know** |
| **React 18** | Frontend (`frontend/src/`) | Declarative, component-driven SPA interface | Vue.js, Angular, Svelte | 🔴 **Must Know** |
| **Flask Session** | Security (`auth.py`) | Signed cookie-based session management | JWT, Redis Sessions | 🔴 **Must Know** |
| **Vite** | Build Tool (`vite.config.js`) | HMR development server and production bundler | Webpack, Parcel | 🟡 **Should Know** |
| **Recharts** | Data Vis (`DashboardPage.jsx`) | React SVG charting for streak and velocity trends | Chart.js, D3.js | 🟡 **Should Know** |
| **Werkzeug Passwords** | Security (`auth.py`) | Salted password hashing (`pbkdf2:sha256`/`scrypt`) | bcrypt, Argon2 | 🟡 **Should Know** |
| **SMTP / smtplib** | Background Worker (`scheduler.py`) | Automated email notification delivery | SendGrid, AWS SES | 🟢 **Awareness** |

---

## 4. Complete File Map

```text
DSA_Revision_Tracker/
├── app.py                  # Server entry point & static file catch-all
├── models.py               # SQLite connection helper & schema creation
├── utils.py                # Spaced repetition scheduling pure logic
├── routes.py               # REST API Blueprint for problem CRUD
├── auth.py                 # Blueprint for authentication & @login_required
├── analytics.py            # Blueprint for streak, graph & summary analytics
├── social.py               # Blueprint for user search & friend connections
├── roadmap.py              # Blueprint for curriculum progress tracking
├── scheduler.py            # CLI script for sending daily email reminders
├── requirements.txt        # Python backend dependencies
└── frontend/
    ├── package.json        # Frontend NPM dependencies & scripts
    ├── vite.config.js      # Vite dev server & proxy rules
    └── src/
        ├── App.jsx         # React Root, Router & ProtectedRoute guard
        ├── main.jsx        # DOM mounting point
        ├── context/
        │   └── AuthContext.jsx  # Global user authentication state
        ├── services/
        │   └── api.js      # Axios HTTP API wrapper functions
        ├── pages/
        │   ├── HomePage.jsx          # Log problem & live preview page
        │   ├── DashboardPage.jsx     # Recharts analytics & streak banner
        │   ├── ProblemsPage.jsx      # Filterable problem grid by state
        │   ├── RoadmapPage.jsx       # 4-week interview curriculum list
        │   ├── FriendsPage.jsx       # Friend search & request manager
        │   ├── PublicProfilePage.jsx # Peer user progress dashboard
        │   ├── LoginPage.jsx         # Sign-in form
        │   └── RegisterPage.jsx      # Account creation form
        └── components/
            ├── Navbar.jsx            # Header navigation bar
            ├── ProblemCard.jsx       # Individual problem UI card
            ├── ConfidenceSelector.jsx# 1-5 rating UI buttons
            ├── StatCard.jsx          # Dashboard statistic tile
            └── LoadingSpinner.jsx    # UI loading indicator
```
