import { useState, useEffect, useCallback } from "react";
import ProblemCard   from "../components/ProblemCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState    from "../components/EmptyState";
import { getProblems, getDueToday, getUpcoming } from "../services/api";

const FlameIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ListIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const CheckCircleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const InboxIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>;

const TABS = [
  { key: "due",      label: "Due Today", icon: <FlameIcon /> },
  { key: "upcoming", label: "Upcoming",  icon: <CalendarIcon /> },
  { key: "active",   label: "Active",    icon: <ListIcon /> },
  { key: "done",     label: "Done",      icon: <CheckCircleIcon /> },
];

const EMPTY = {
  due:      { icon: <InboxIcon />, title: "Nothing due today", message: "Great job — come back tomorrow." },
  upcoming: { icon: <InboxIcon />, title: "No upcoming problems",  message: "Add problems from the Tracker page." },
  active:   { icon: <InboxIcon />, title: "No active problems",   message: "Start by adding a problem." },
  done:     { icon: <InboxIcon />, title: "None completed yet",    message: "Mark problems as done after reviewing." },
};

export default function ProblemsPage() {
  const [tab,      setTab]      = useState("due");
  const [due,      setDue]      = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dueData, upcomingData, allData] = await Promise.all([
        getDueToday(),
        getUpcoming(),
        getProblems(),
      ]);
      setDue(dueData);
      setUpcoming(upcomingData);
      setAll(allData);
    } catch {
      setError("Could not load problems. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derive lists from fetched data ────────────────────────
  const active = all.filter((p) => !p.is_done);
  const done   = all.filter((p) => p.is_done);

  const listMap = { due, upcoming, active, done };
  const problems = listMap[tab] ?? [];

  // ── Tab counts ────────────────────────────────────────────
  const counts = {
    due:      due.length,
    upcoming: upcoming.length,
    active:   active.length,
    done:     done.length,
  };

  return (
    <div className="page">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">Problems</h2>
        <p className="text-sm text-muted mt-2">
          {loading ? "Loading…" : `${all.length} total · ${due.length} due today`}
        </p>
      </div>

      {/* ── Error banner ────────────────────────────────── */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Tab bar ─────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: `1px solid ${tab === key ? "var(--accent)" : "var(--border)"}`,
              background: tab === key ? "var(--accent-soft)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all var(--transition)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {icon} {label}
            {counts[key] > 0 && (
              <span style={{
                background: tab === key ? "var(--accent)" : "var(--surface-raised)",
                color: tab === key ? "#fff" : "var(--text-muted)",
                borderRadius: "20px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 600,
                marginLeft: "2px"
              }}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={fetchAll}
          className="btn btn-ghost"
          style={{ marginLeft: "auto", padding: "6px 12px", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg> Refresh
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner />
      ) : problems.length === 0 ? (
        <EmptyState {...EMPTY[tab]} />
      ) : (
        <div className="flex-col gap-3">
          {problems.map((p) => (
            <ProblemCard key={p.id} problem={p} onRefresh={fetchAll} />
          ))}
        </div>
      )}
    </div>
  );
}
