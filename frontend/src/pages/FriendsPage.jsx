import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchUsers, getFriends, sendFriendRequest, acceptFriendRequest, removeFriend } from "../services/api";

const UsersIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default function FriendsPage() {
  const [friendsData, setFriendsData] = useState({ friends: [], pending: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const data = await getFriends();
      setFriendsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (id) => {
    try {
      await sendFriendRequest(id);
      alert("Request sent!");
      fetchFriends();
    } catch (e) {
      alert(e.response?.data?.error || "Error sending request");
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptFriendRequest(id);
      fetchFriends();
    } catch (e) {
      alert(e.response?.data?.error || "Error accepting request");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await removeFriend(id);
      fetchFriends();
    } catch (e) {
      alert(e.response?.data?.error || "Error removing");
    }
  };

  if (loading) return <div className="page" style={{padding: "var(--space-8)"}}>Loading friends...</div>;

  return (
    <div className="page">
      <div className="flex items-center gap-3 mb-8">
        <span style={{ color: "var(--accent)" }}><UsersIcon /></span>
        <h2 className="text-xl font-bold">Friends & Connections</h2>
      </div>

      {/* Search Section */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">Find Users</h3>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "var(--space-3)" }}>
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {searchResults.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--surface-raised)", borderRadius: "var(--radius-sm)" }}>
                <span className="font-medium text-sm">{u.username}</span>
                <button onClick={() => handleAdd(u.id)} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "12px" }}>Add Friend</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)" }}>
        {/* Pending Requests */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {friendsData.pending.length === 0 && <p className="text-sm text-muted">No pending requests.</p>}
            {friendsData.pending.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--surface-raised)", borderRadius: "var(--radius-sm)" }}>
                <span className="font-medium text-sm">{u.username}</span>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button onClick={() => handleAccept(u.id)} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "12px" }}>Accept</button>
                  <button onClick={() => handleRemove(u.id)} className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Friends */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">My Friends</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {friendsData.friends.length === 0 && <p className="text-sm text-muted">No friends yet.</p>}
            {friendsData.friends.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--surface-raised)", borderRadius: "var(--radius-sm)" }}>
                <Link to={`/profile/${u.id}`} style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                  {u.username}
                </Link>
                <button onClick={() => handleRemove(u.id)} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "12px", color: "var(--red)" }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
