import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import "../styles/Login.css";

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ role, email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.user.role === "student") navigate("/student/dashboard");
      else navigate("/faculty/dashboard");
    } catch (err) {
      setError(err.message || err);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>

        <div className="role-toggle">
          <button
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
            type="button"
          >
            Student
          </button>
          <button
            className={role === "faculty" ? "active" : ""}
            onClick={() => setRole("faculty")}
            type="button"
          >
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="login-btn">Login</button>
        </form>
        <div style={{ marginTop: 8 }}>
          New user? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
