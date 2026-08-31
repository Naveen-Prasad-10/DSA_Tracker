# Module 4: Analytics Engine & Data Visualization

## 1. Overview
The **Analytics Module** (`analytics.py`) derives performance metrics from existing database records (`problems` table). It exposes GET-only read endpoints for streak calculations, daily solve counts, weak topic detection, and summary statistics.

---

## 2. Streak Calculation Algorithm (`GET /analytics/streak`)

The streak algorithm computes consecutive daily solve activity.

```python
@analytics_bp.route("/streak")
@login_required
def streak():
    user_id = session.get("user_id")
    conn = get_db()
    rows = conn.execute(
        "SELECT DISTINCT date_solved FROM problems WHERE user_id = ? ORDER BY date_solved ASC", (user_id,)
    ).fetchall()
    conn.close()

    if not rows:
        return jsonify({"current_streak": 0, "longest_streak": 0, "total_active_days": 0})

    dates = sorted({date.fromisoformat(row["date_solved"]) for row in rows})

    # Calculate longest streak
    longest = 1
    current_run = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            current_run += 1
            if current_run > longest:
                longest = current_run
        else:
            current_run = 1

    # Calculate active current streak
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
        "current_streak": current_streak,
        "longest_streak": longest,
        "total_active_days": len(dates),
    })
```

### Key Logic Steps:
1. **Deduplication**: Filters `date_solved` down to unique calendar dates (`sorted({date.fromisoformat(...)})`).
2. **Longest Streak**: Iterates from left to right, comparing `(date[i] - date[i-1]).days == 1`.
3. **Current Streak**: Verifies if the most recent solve date (`dates[-1]`) is either today or yesterday (`>= today - 1 day`). If so, walks backwards until a missing day is detected.

---

## 3. Solve Velocity over 30 Days (`GET /analytics/problems-over-time`)

To keep charts consistent, the backend backfills missing dates with zero values for the last 30 days.

```python
@analytics_bp.route("/problems-over-time")
@login_required
def problems_over_time():
    user_id = session.get("user_id")
    conn = get_db()
    rows = conn.execute(
        """
        SELECT date_solved, COUNT(*) AS count
        FROM problems
        WHERE user_id = ?
        GROUP BY date_solved
        ORDER BY date_solved ASC
        """, (user_id,)
    ).fetchall()
    conn.close()

    solve_map = {row["date_solved"]: row["count"] for row in rows}
    today = date.today()
    result = [
        {
            "date": (today - timedelta(days=i)).isoformat(),
            "count": solve_map.get((today - timedelta(days=i)).isoformat(), 0),
        }
        for i in range(29, -1, -1)
    ]
    return jsonify(result)
```

---

## 4. Weak Topics Detection (`GET /analytics/weak-topics`)

Weak topics are prioritized using average confidence scores (`avg_confidence ASC`) and problem counts (`problem_count DESC`).

```sql
SELECT
    topic,
    ROUND(AVG(confidence), 2) AS avg_confidence,
    COUNT(*) AS problem_count,
    SUM(CASE WHEN is_done = 0 THEN 1 ELSE 0 END) AS active_count
FROM problems
WHERE user_id = ?
GROUP BY topic
HAVING COUNT(*) >= 1
ORDER BY avg_confidence ASC, problem_count DESC
LIMIT 10
```

---

## 5. Recharts Frontend Integration (`DashboardPage.jsx`)

`DashboardPage.jsx` renders analytics visually using Recharts:
* **LineChart**: Renders `problems-over-time` trend line.
* **BarChart**: Renders horizontal weak topic confidence bars with dynamic color-coding (`#f87171` for confidence < 2.5, `#fbbf24` for < 3.5, `#34d399` for higher).
