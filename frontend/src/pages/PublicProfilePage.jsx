import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicProfile } from "../services/api";

const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicProfile(id)
      .then(data => setProfile(data))
      .catch(err => setError(err.response?.data?.error || "Error loading profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page" style={{padding: "var(--space-8)"}}>Loading profile...</div>;
  if (error) return <div className="page" style={{padding: "var(--space-8)", color: "var(--red)"}}>{error}</div>;
  if (!profile) return null;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <Link to="/friends" className="btn btn-ghost" style={{ padding: "6px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <ArrowLeftIcon /> Back
        </Link>
        <h2 className="text-xl font-bold" style={{ margin: 0 }}>{profile.username}'s Profile</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--accent)" }}>{profile.current_streak}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>Current Streak (Days)</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--green)" }}>{profile.total_solved}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>Problems Solved</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--yellow)" }}>{profile.roadmap_count}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>Roadmap Items Done</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "1 1 300px" }}>
          <h3 className="text-lg font-semibold mb-4">Difficulty Breakdown</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-Easy">Easy</span>
              <strong style={{ fontSize: "16px" }}>{profile.difficulties.Easy || 0}</strong>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-Medium">Medium</span>
              <strong style={{ fontSize: "16px" }}>{profile.difficulties.Medium || 0}</strong>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-Hard">Hard</span>
              <strong style={{ fontSize: "16px" }}>{profile.difficulties.Hard || 0}</strong>
            </li>
          </ul>
        </div>

        <div className="card" style={{ flex: "2 1 400px" }}>
          <h3 className="text-lg font-semibold mb-4">Recently Solved</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {profile.recent_problems.length === 0 && <p className="text-sm text-muted">No problems solved yet.</p>}
            {profile.recent_problems.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3) var(--space-4)", background: "var(--surface-raised)", borderRadius: "var(--radius-sm)" }}>
                <span className="font-medium text-sm">{p.title}</span>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                  <span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>{p.date_solved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
