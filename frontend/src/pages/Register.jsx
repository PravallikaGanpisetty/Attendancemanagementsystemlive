import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import "../styles/Login.css";

export default function Register() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await register({ name, role, email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.user.role === "student") navigate("/student/dashboard");
      else navigate("/faculty/dashboard");
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Register</h2>

        <div className="role-toggle">
          <button className={role === "student" ? "active" : ""} onClick={() => setRole("student")} type="button">Student</button>
          <button className={role === "faculty" ? "active" : ""} onClick={() => setRole("faculty")} type="button">Faculty</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="login-btn">Create account</button>
        </form>

        <div style={{ marginTop: 8 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}


