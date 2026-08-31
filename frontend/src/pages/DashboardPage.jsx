import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import StatCard      from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import {
  getSummary, getStreak, getProblemsOverTime, getWeakTopics,
} from "../services/api";

// ── Icons ─────────────────────────────────────────────────────────────────────
const BookIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>;
const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const FlameIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const StarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, valueLabel }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      padding: "8px 12px",
      fontSize: "12px",
      color: "var(--text)",
      boxShadow: "var(--shadow-md)"
    }}>
      <p style={{ color: "var(--text-subtle)", marginBottom: 4 }}>{label}</p>
      <p><strong style={{ color: "var(--text)", fontWeight: 600 }}>{payload[0].value}</strong> {valueLabel}</p>
    </div>
  );
}

// ── Bar colour by confidence ──────────────────────────────────────────────────
function barColour(conf) {
  if (conf < 2.5) return "#f87171";
  if (conf < 3.5) return "#fbbf24";
  return "#34d399";
}

// ── Streak helper message ─────────────────────────────────────────────────────
function streakMsg(cur, best) {
  if (cur === 0)       return ["No active streak", "Solve a problem today to start one."];
  if (cur >= best && best > 1) return ["Personal best", `${cur} days straight`];
  if (cur >= 7)        return ["On fire", `${best - cur} days to best`];
  return [`${cur}-day streak`, `Best: ${best} days`];
}

export default function DashboardPage() {
  const [summary,   setSummary]   = useState(null);
  const [streak,    setStreak]    = useState(null);
  const [overTime,  setOverTime]  = useState([]);
  const [weakTopics, setWeak]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, st, ot, wt] = await Promise.all([
        getSummary(),
        getStreak(),
        getProblemsOverTime(),
        getWeakTopics(),
      ]);
      setSummary(s);
      setStreak(st);
      // Keep only days with solves + last 14 for readability
      setOverTime(ot.slice(-30));
      setWeak(wt);
    } catch {
      setError("Could not load analytics. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="page"><LoadingSpinner text="Loading analytics…" /></div>;

  if (error) return (
    <div className="page">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  const [smsg, ssub] = streakMsg(streak?.current_streak ?? 0, streak?.longest_streak ?? 0);

  // Format date labels for X axis: "Mar 28" → "28"
  const fmtDate = (d) => d?.slice(5).replace("-", "/");  // "2026-03-28" → "03/28"

  return (
    <div className="page-wide">

      {/* ── Toolbar ───────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "1.3rem" }}>Analytics</h2>
          <p style={{ color: "var(--text-muted)", fontSize: ".84rem", marginTop: 3 }}>Your coding progress at a glance</p>
        </div>
        <button
          onClick={fetchAll}
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Summary cards ────────────────────────────── */}
      <p className="section-label">Overview</p>
      <div style={{ display: "flex", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)", marginBottom: "var(--space-6)", overflow: "hidden" }}>
        <StatCard icon={<BookIcon />} label="Total Problems" value={summary?.total_problems} />
        <StatCard icon={<CheckCircleIcon />} label="Active"          value={summary?.active}         accent="green" />
        <StatCard icon={<FlameIcon />} label="Due Today"       value={summary?.due_today}      accent="yellow" />
        <StatCard icon={<StarIcon />} label="Avg Confidence"  value={summary?.avg_confidence?.toFixed(1)} isLast />
      </div>

      {/* ── Streak banner ────────────────────────────── */}
      <p className="section-label">Consistency</p>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-6)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-6)",
        marginBottom: "var(--space-6)",
        flexWrap: "wrap",
      }}>
        <div style={{ color: streak?.current_streak > 0 ? "var(--yellow)" : "var(--text-subtle)", opacity: streak?.current_streak > 0 ? 1 : 0.5 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
        </div>

        <div style={{ display: "flex", gap: "var(--space-8)", flex: 1, flexWrap: "wrap" }}>
          {[
            { val: streak?.current_streak, lbl: "Current Streak" },
            { val: streak?.longest_streak, lbl: "Longest Streak" },
            { val: streak?.total_active_days, lbl: "Days Active" },
          ].map(({ val, lbl }) => (
            <div key={lbl}>
              <div style={{ fontSize: "28px", fontWeight: 600, lineHeight: 1, color: "var(--text)" }}>{val ?? "—"}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", fontWeight: 500 }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-2) var(--space-4)",
          textAlign: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "14px" }}>{smsg}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{ssub}</div>
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────── */}
      <p className="section-label">Activity</p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }} className="charts-responsive">

        {/* Line chart — problems over time */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: ".95rem" }}>Problems Solved per Day</div>
            <div style={{ fontSize: ".74rem", color: "var(--text-muted)", marginTop: 2 }}>Last 30 days</div>
          </div>
          {overTime.every((d) => d.count === 0) ? (
            <EmptyState title="No data yet" message="Start adding problems to see trends." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={overTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<DarkTooltip valueLabel="problems" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={(props) => props.payload.count > 0
                    ? <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="var(--accent)" stroke="none" />
                    : <g key={props.key} />
                  }
                  activeDot={{ r: 6, fill: "var(--accent)", stroke: "none" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — weak topics */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: ".95rem" }}>Weak Topics</div>
            <div style={{ fontSize: ".74rem", color: "var(--text-muted)", marginTop: 2 }}>
              Sorted by avg confidence ↑
            </div>
          </div>
          {weakTopics.length === 0 ? (
            <EmptyState title="No topic data" message="Add problems with topics to see analysis." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={weakTopics}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    width={90}
                    tick={{ fontSize: 11, fill: "var(--text)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "12px", boxShadow: "var(--shadow-md)" }}>
                          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{d.topic}</p>
                          <p style={{ color: "var(--text-muted)" }}>Avg confidence: <strong style={{color:"var(--text)"}}>{d.avg_confidence}</strong>/5</p>
                          <p style={{ color: "var(--text-muted)" }}>Problems: {d.problem_count}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avg_confidence" radius={[0, 4, 4, 0]}>
                    {weakTopics.map((entry, i) => (
                      <Cell key={i} fill={barColour(entry.avg_confidence)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Mini legend table */}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                {weakTopics.slice(0, 5).map((t) => (
                  <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".78rem" }}>
                    <span style={{ flex: 1, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.topic}</span>
                    <span style={{ color: "var(--text-muted)" }}>{t.problem_count} probs</span>
                    <span style={{
                      padding: "1px 8px", borderRadius: 20, fontWeight: 700, fontSize: ".68rem",
                      background: `${barColour(t.avg_confidence)}22`,
                      color: barColour(t.avg_confidence),
                    }}>
                      {t.avg_confidence} / 5
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Responsive chart grid collapse */}
      <style>{`
        @media (max-width: 720px) {
          .charts-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
