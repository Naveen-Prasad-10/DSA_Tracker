/**
 * StatCard — metric item for the dashboard strip.
 *
 * Props:
 *   icon     : ReactNode
 *   value    : string | number
 *   label    : string
 *   accent   : "default" | "green" | "yellow" | "red"
 *   isLast   : boolean
 */
const COLOR_MAP = {
  default: "var(--accent)",
  green:   "var(--green)",
  yellow:  "var(--yellow)",
  red:     "var(--red)",
};

export default function StatCard({ icon, value, label, accent = "default", isLast }) {
  return (
    <div className="animate-up" style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "var(--space-3)", 
      padding: "var(--space-4) var(--space-6)", 
      borderRight: isLast ? "none" : "1px solid var(--border)", 
      flex: 1, 
      minWidth: "180px" 
    }}>
      <div style={{ color: COLOR_MAP[accent], display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.1, color: "var(--text)" }}>
          {value ?? "—"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500, marginTop: "4px" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
