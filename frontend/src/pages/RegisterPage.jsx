import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ username, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="page" style={{ maxWidth: 400, margin: "var(--space-12) auto" }}>
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Register</h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="field">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary mt-2">
            Register
          </button>
        </form>
        
        <p className="text-sm text-muted mt-6 text-center">
          Already have an account? <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
