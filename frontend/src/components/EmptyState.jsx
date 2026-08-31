/**
 * EmptyState — shown when a list has no data.
 *
 * Props:
 *   icon    : ReactNode
 *   title   : string
 *   message : string
 */
export default function EmptyState({ icon, title, message }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--space-12) var(--space-4)",
        gap: "var(--space-3)",
        textAlign: "center",
      }}
    >
      {icon && (
        <span style={{ display: "inline-flex", color: "var(--text-subtle)", marginBottom: "var(--space-2)" }}>
          {icon}
        </span>
      )}
      {title && (
        <p className="text-base font-semibold">{title}</p>
      )}
      {message && (
        <p className="text-sm text-muted" style={{ maxWidth: 300 }}>{message}</p>
      )}
    </div>
  );
}
