/**
 * ConfidenceSelector — 5 pill buttons (1–5).
 *
 * Props:
 *   value    : number   — currently selected confidence
 *   onChange : fn(n)    — called when user clicks a button
 *   disabled : bool     — grey out while saving
 */
export default function ConfidenceSelector({ value, onChange, disabled }) {
  const labels = { 1: "Forgot", 2: "Hard", 3: "OK", 4: "Good", 5: "Easy" };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          title={labels[n]}
          style={{
            flex: 1,
            minWidth: "50px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 4px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${value === n ? "var(--accent)" : "var(--border)"}`,
            background: value === n ? "var(--accent-soft)" : "var(--surface-raised)",
            color: value === n ? "var(--accent)" : "var(--text-muted)",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all var(--transition)",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "16px", lineHeight: 1.2, color: value === n ? "var(--text)" : "inherit" }}>{n}</span>
          <span style={{ fontSize: "11px", marginTop: "2px" }}>{labels[n]}</span>
        </button>
      ))}
    </div>
  );
}
