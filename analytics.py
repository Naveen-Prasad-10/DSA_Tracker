"""
analytics.py — Flask Blueprint for the Analytics Dashboard.

All endpoints are GET-only, read-only queries against the existing 'problems' table.
No schema changes required — all signals are derived from existing columns:
  date_solved, confidence, topic, is_done.

Endpoints:
  GET /analytics/problems-over-time   → daily solve counts (last 30 days)
  GET /analytics/weak-topics          → topics ranked by avg confidence (ASC)
  GET /analytics/streak               → current & longest consecutive-day streaks
  GET /analytics/summary              → headline stats for the dashboard cards
"""

from flask import Blueprint, jsonify, session
from models import get_db
from datetime import date, timedelta
from auth import login_required

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")


# ── 1. Problems Solved Over Time ──────────────────────────────────────────────
@analytics_bp.route("/problems-over-time")
@login_required
def problems_over_time():
    """
    Returns daily problem counts for the last 30 days.
    Days with zero solves are included so the line chart always has 30 points.

    Response: [ { "date": "YYYY-MM-DD", "count": N }, ... ]
    """
    user_id = session.get("user_id")
    conn = get_db()
    rows = conn.execute(
        """
        SELECT date_solved, COUNT(*) AS count
        FROM   problems
        WHERE  user_id = ?
        GROUP  BY date_solved
        ORDER  BY date_solved ASC
        """, (user_id,)
    ).fetchall()
    conn.close()

    # Build a lookup: date_string → count
    solve_map = {row["date_solved"]: row["count"] for row in rows}

    today = date.today()
    if not rows:
        return jsonify([])

    first_date = date.fromisoformat(rows[0]["date_solved"])
    days_since_first = (today - first_date).days
    # Enforce a minimum 2-day offset (so the graph always has at least 3 points and draws a line)
    start_offset = max(2, min(29, days_since_first))

    result = [
        {
            "date":  (today - timedelta(days=i)).isoformat(),
            "count": solve_map.get((today - timedelta(days=i)).isoformat(), 0),
        }
        for i in range(start_offset, -1, -1)
    ]
    return jsonify(result)


# ── 2. Weak Topics Detection ──────────────────────────────────────────────────
@analytics_bp.route("/weak-topics")
@login_required
def weak_topics():
    """
    Identifies weak topics using two signals:
      - avg_confidence : lower = weaker  (primary sort key)
      - problem_count  : how many problems you've done in this topic

    Only topics with at least 1 problem are included.
    Returns up to 10 topics sorted weakest-first.

    Response: [
      {
        "topic":          "Arrays",
        "avg_confidence": 2.3,
        "problem_count":  5,
        "active_count":   3
      }, ...
    ]
    """
    user_id = session.get("user_id")
    conn = get_db()
    rows = conn.execute(
        """
        SELECT
            topic,
            ROUND(AVG(confidence), 2)                            AS avg_confidence,
            COUNT(*)                                             AS problem_count,
            SUM(CASE WHEN is_done = 0 THEN 1 ELSE 0 END)        AS active_count
        FROM   problems
        WHERE  user_id = ?
        GROUP  BY topic
        HAVING COUNT(*) >= 1
        ORDER  BY avg_confidence ASC, problem_count DESC
        LIMIT  10
        """, (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# ── 3. Streak Tracking ────────────────────────────────────────────────────────
@analytics_bp.route("/streak")
@login_required
def streak():
    """
    Computes streak statistics from distinct dates in date_solved.
    A streak = at least 1 problem solved on consecutive calendar days.

    Response: {
      "current_streak":    N,   # consecutive days ending today (or yesterday)
      "longest_streak":    N,   # best ever streak
      "total_active_days": N    # total distinct days with any solve
    }
    """
    user_id = session.get("user_id")
    conn = get_db()
    rows = conn.execute(
        "SELECT DISTINCT date_solved FROM problems WHERE user_id = ? ORDER BY date_solved ASC", (user_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return jsonify({"current_streak": 0, "longest_streak": 0, "total_active_days": 0})

    # Parse and deduplicate
    dates = sorted({date.fromisoformat(row["date_solved"]) for row in rows})

    # ── Longest streak ────────────────────────────────────────────────────────
    longest   = 1
    current_run = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            current_run += 1
            if current_run > longest:
                longest = current_run
        else:
            current_run = 1

    # ── Current streak (must include today or yesterday to be live) ───────────
    today = date.today()
    current_streak = 0
    if dates[-1] >= today - timedelta(days=1):
        current_streak = 1
        for i in range(len(dates) - 2, -1, -1):
            if (dates[i + 1] - dates[i]).days == 1:
                current_streak += 1
            else:
                break

    return jsonify({
        "current_streak":    current_streak,
        "longest_streak":    longest,
        "total_active_days": len(dates),
    })


# ── 4. Summary (headline stats) ───────────────────────────────────────────────
@analytics_bp.route("/summary")
@login_required
def summary():
    """
    Aggregate headline numbers for the dashboard cards.

    Response: {
      "total_problems":  N,
      "due_today":       N,
      "completed":       N,
      "active":          N,
      "avg_confidence":  X.X
    }
    """
    today = date.today().isoformat()
    user_id = session.get("user_id")
    conn  = get_db()

    total     = conn.execute("SELECT COUNT(*) FROM problems WHERE user_id = ?", (user_id,)).fetchone()[0]
    due       = conn.execute(
        "SELECT COUNT(*) FROM problems WHERE user_id = ? AND next_review <= ? AND is_done = 0", (user_id, today)
    ).fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM problems WHERE user_id = ? AND is_done = 1", (user_id,)).fetchone()[0]
    avg_conf  = conn.execute(
        "SELECT ROUND(AVG(confidence), 2) FROM problems WHERE user_id = ? AND is_done = 0", (user_id,)
    ).fetchone()[0] or 0

    conn.close()
    return jsonify({
        "total_problems": total,
        "due_today":      due,
        "completed":      completed,
        "active":         total - completed,
        "avg_confidence": avg_conf,
    })
