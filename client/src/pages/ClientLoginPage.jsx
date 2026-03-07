import React, { useState } from "react";
import { api, setAuthToken } from "../api";

export default function ClientLoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/client-login", {
        email,
        password,
      });

      setAuthToken(data.token);

      const payload = {
        token: data.token,
        user: data.user,
        client: data.client,
      };

      localStorage.setItem("client_auth", JSON.stringify(payload));
      onLogin(payload);
    } catch (error) {
      setErr(error?.response?.data?.error || "Client login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Client Portal Login</h2>
        <p>Login to view your account, trades, and subscription.</p>

        <form onSubmit={submit} className="form-grid">
          <div className="full-width">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="full-width">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {err ? <div className="error-box full-width">{err}</div> : null}

          <div className="full-width">
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}