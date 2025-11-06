const API_BASE = import.meta.env.VITE_API_BASE || "https://attendancemanagementbackend.onrender.com/api";

export async function login({ role, email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, email, password }),
    credentials: 'include',
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response (${res.status}): ${text.slice(0,200)}`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function register({ name, role, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, role, email, password }),
    credentials: 'include',
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response (${res.status}): ${text.slice(0,200)}`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}
