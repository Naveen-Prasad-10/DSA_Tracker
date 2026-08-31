import { useState, useEffect } from "react";
import ConfidenceSelector from "../components/ConfidenceSelector";
import { addProblem, getDueToday } from "../services/api";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  title:       "",
  topic:       "",
  difficulty:  "Medium",
  date_solved: TODAY,
  confidence:  3,
  custom_days: "",
};

export default function HomePage() {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [status,  setStatus]  = useState(null);   // { type: "ok"|"err", msg }
  const [loading, setLoading] = useState(false);
  const [dueCount, setDueCount] = useState(null);

  // ── Fetch due-today count for the header chip ─────────────
  useEffect(() => {
    getDueToday()
      .then((d) => setDueCount(d.length))
      .catch(() => {});
  }, []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // ── Schedule preview ──────────────────────────────────────
  const INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
  const previewDays = form.custom_days
    ? parseInt(form.custom_days)
    : INTERVALS[form.confidence];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.topic.trim()) {
      setStatus({ type: "err", msg: "⚠️ Title and topic are required." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload = {
        title:       form.title.trim(),
        topic:       form.topic.trim(),
        difficulty:  form.difficulty,
        date_solved: form.date_solved,
        confidence:  form.confidence,
        custom_days: form.custom_days ? parseInt(form.custom_days) : null,
      };
      const data = await addProblem(payload);
      setStatus({ type: "ok", msg: `✅ Added! Next review: ${data.next_review}` });
      setForm(EMPTY_FORM);
      setDueCount((c) => c); // don't change count — problem isn't due yet
    } catch (err) {
      const msg = err?.response?.data?.error || "Something went wrong.";
      setStatus({ type: "err", msg: `❌ ${msg}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 560 }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div>
            <h2 className="text-xl font-bold">Add Problem</h2>
            <p className="text-sm text-muted mt-2">
              Log a solved problem and schedule your next review.
            </p>
          </div>
          {dueCount !== null && (
            <div style={{
              background: dueCount > 0 ? "rgba(245,158,11,0.1)" : "var(--surface-raised)",
              border: `1px solid ${dueCount > 0 ? "rgba(245,158,11,0.2)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              padding: "8px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 600, color: dueCount > 0 ? "var(--yellow)" : "var(--text)" }}>
                {dueCount}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "2px" }}>
                Due today
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────── */}
      <div className="card">
        <form onSubmit={handleSubmit} noValidate>

          <div className="field">
            <label htmlFor="title">Problem Title</label>
            <input
              id="title"
              className="input"
              type="text"
              placeholder="e.g. Two Sum"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="topic">Topic(s)</label>
            <input
              id="topic"
              className="input"
              type="text"
              placeholder="e.g. Arrays, HashMap"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              required
            />
          </div>

          <div className="field row-2">
            <div>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                className="select"
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date_solved">Date Solved</label>
              <input
                id="date_solved"
                className="input"
                type="date"
                value={form.date_solved}
                onChange={(e) => set("date_solved", e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>
              Confidence
              <span className="hint"> (1 = forgot it, 5 = nailed it)</span>
            </label>
            <ConfidenceSelector
              value={form.confidence}
              onChange={(v) => set("confidence", v)}
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="custom_days">
              Custom Interval
              <span className="hint"> (days — overrides confidence if set)</span>
            </label>
            <input
              id="custom_days"
              className="input"
              type="number"
              min={1}
              max={365}
              placeholder="Leave blank to use confidence"
              value={form.custom_days}
              onChange={(e) => set("custom_days", e.target.value)}
            />
          </div>

          {/* Schedule preview */}
          <div style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            padding: "8px 12px",
            background: "var(--surface-raised)",
            borderRadius: "var(--radius-sm)",
            borderLeft: "3px solid var(--accent)",
            marginBottom: "var(--space-4)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: "var(--text-subtle)"}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Next review in <strong style={{ color: "var(--text)", fontWeight: 500 }}>{previewDays} {previewDays === 1 ? "day" : "days"}</strong></span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding…" : "➕ Add Problem"}
          </button>

          {status && (
            <p className={`feedback ${status.type === "ok" ? "ok" : "err"}`}>
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
