import { useState } from "react";
import ConfidenceSelector from "./ConfidenceSelector";
import { updateProblem, toggleDone, deleteProblem } from "../services/api";
import "./ProblemCard.css";

const CalendarIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const StarIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const UndoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

/**
 * ProblemCard — renders one problem row with inline revise + actions.
 *
 * Props:
 *   problem  : object   — problem data from API
 *   onRefresh: fn()     — called after any mutation to re-fetch parent list
 */
export default function ProblemCard({ problem: p, onRefresh }) {
  const [revising,  setRevising]  = useState(false);
  const [conf,      setConf]      = useState(p.confidence);
  const [saving,    setSaving]    = useState(false);

  // ── Overdue highlight ─────────────────────────────────────
  const today    = new Date().toISOString().slice(0, 10);
  const isOverdue = !p.is_done && p.next_review < today;
  const isDueToday = !p.is_done && p.next_review === today;

  const statusDot = isOverdue ? "red" : isDueToday ? "yellow" : "green";

  // ── Save revised confidence ───────────────────────────────
  async function handleSaveRevise() {
    setSaving(true);
    try {
      await updateProblem(p.id, { confidence: conf });
      setRevising(false);
      await onRefresh();
    } catch {
      /* swallow — could surface an error toast */
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle done ───────────────────────────────────────────
  async function handleToggleDone() {
    try {
      await toggleDone(p.id);
      await onRefresh();
    } catch { /* no-op */ }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete() {
    if (!window.confirm(`Delete "${p.title}" permanently?`)) return;
    try {
      await deleteProblem(p.id);
      await onRefresh();
    } catch { /* no-op */ }
  }

  return (
    <div className={`pcard animate-up${p.is_done ? " pcard--done" : ""}`}>
      {/* ── Status dot + title ───────────────────────────── */}
      <div className="pcard-left">
        <span className={`pcard-dot pcard-dot--${statusDot}`} title={
          isOverdue ? "Overdue" : isDueToday ? "Due today" : "Scheduled"
        } />
        <div className="pcard-info">
          <span className="pcard-title">{p.title}</span>
          <div className="pcard-meta">
            <span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span>
            <span className="pcard-topic">{p.topic}</span>
            <span className="pcard-date"><CalendarIcon /> {p.next_review}</span>
            <span className="pcard-conf" title="Confidence"><StarIcon /> {p.confidence}/5</span>
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="pcard-actions">
        {!p.is_done && !revising && (
          <button className="btn btn-ghost" onClick={() => setRevising(true)}>
            Revise
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ padding: "6px" }}
          onClick={handleToggleDone}
          title={p.is_done ? "Reactivate" : "Mark done"}
        >
          {p.is_done ? <UndoIcon /> : <CheckIcon />}
        </button>
        <button 
          className="btn btn-danger" 
          style={{ padding: "6px" }}
          onClick={handleDelete} 
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>

      {/* ── Inline revise panel ───────────────────────────── */}
      {revising && (
        <div className="pcard-revise animate-up">
          <span className="pcard-revise-label">How well did you remember it?</span>
          <ConfidenceSelector value={conf} onChange={setConf} disabled={saving} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setRevising(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSaveRevise}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save & Reschedule"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
