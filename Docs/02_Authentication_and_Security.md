# Module 2: Authentication & Authorization Architecture

## 1. Overview
The application uses stateful, server-side session cookies managed via Flask sessions and `werkzeug.security` cryptographic password hashing.

---

## 2. Authentication Blueprint (`auth.py`)

### 2.1 Password Hashing & Registration (`POST /auth/register`)
Passwords are never saved in plain text. On registration, the raw string is converted to a salted hash using Werkzeug's secure hash generator (`pbkdf2:sha256` / `scrypt`).

```python
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
        
    username = data["username"].strip()
    password = data["password"]
    
    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        conn.close()
        return jsonify({"error": "Username already exists"}), 409
        
    password_hash = generate_password_hash(password)
    created_at = datetime.utcnow().isoformat()
    
    cursor = conn.execute(
        "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
        (username, password_hash, created_at)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    session["user_id"] = user_id
    session["username"] = username
    
    return jsonify({"message": "User registered successfully", "user": {"id": user_id, "username": username}}), 201
```

### 2.2 Login & Verification (`POST /auth/login`)
During login, `check_password_hash` compares the incoming raw password string with the database hash.

```python
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401
        
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    
    return jsonify({"message": "Logged in successfully", "user": {"id": user["id"], "username": user["username"]}})
```

---

## 3. Authorization Guard (`@login_required`)

To protect private API endpoints, a custom Python decorator is applied using `functools.wraps`.

```python
import functools

def login_required(view):
    @functools.wraps(view)
    def wrapped_view(*args, **kwargs):
        if session.get('user_id') is None:
            return jsonify({"error": "Unauthorized"}), 401
        return view(*args, **kwargs)
    return wrapped_view
```

### How `@login_required` Operates:
1. Intercepts incoming HTTP requests to protected endpoints (`/problems`, `/analytics`, `/social`).
2. Checks `session.get('user_id')`.
3. If `user_id` is missing or `None`, aborts immediately with an HTTP 401 Unauthorized response.
4. If valid, delegates execution to the underlying route handler (`view(*args, **kwargs)`).

---

## 4. Frontend Auth State (`AuthContext.jsx` & `ProtectedRoute`)

### 4.1 Global State Provider
`AuthContext.jsx` provides global user session state (`user`, `loading`) across the React component tree.

```jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  ...
}
```

### 4.2 Route Guard Component (`App.jsx`)
```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

---

## 5. Security Audit & Interview Defense

### Key Strengths:
* Passwords are properly salted and hashed.
* Parameterized SQL queries prevent SQL injection during user authentication.
* Session fixation is prevented by running `session.clear()` upon successful login.

### Vulnerabilities & Limitations:
* **Default Secret Key Risk**: `app.py` falls back to `"coding-tracker-super-secret-key-123"`. In production, if `SECRET_KEY` is unconfigured, attackers can craft signed session cookies to impersonate users.
* **Cookie Flags**: Missing explicit `SameSite=Lax/Strict` and `HttpOnly` flags on session cookies.
