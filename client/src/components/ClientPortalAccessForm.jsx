import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function ClientPortalAccessForm({ client, onClose, onDone }) {
  const [mode, setMode] = useState("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    setName(client.name || "");
    setEmail(client.portal_email || "");
    setPassword("");
    setMsg("");
    setErr("");
    setMode(client.user_id ? "reset" : "create");
  }, [client]);

  if (!client) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErr("");

    try {
      if (mode === "create") {
        const { data } = await api.post(`/clients/${client.id}/create-portal-user`, {
          email,
          password,
          name,
        });
        setMsg(data.message || "Portal user created successfully");
      } else {
        const { data } = await api.post(`/clients/${client.id}/reset-portal-password`, {
          password,
        });
        setMsg(data.message || "Password reset successfully");
      }

      if (onDone) onDone();
    } catch (error) {
      setErr(error?.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="card modal-card">
        <div className="modal-header">
          <h3>{mode === "create" ? "Create Client Portal Access" : "Reset Client Portal Password"}</h3>
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="full-width">
            <label>Client</label>
            <input value={client.name || ""} disabled />
          </div>

          {mode === "create" ? (
            <>
              <div>
                <label>Portal Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label>Portal Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <div className="full-width">
              <label>Portal Email</label>
              <input value={email} disabled />
            </div>
          )}

          <div className="full-width">
            <label>{mode === "create" ? "Portal Password" : "New Password"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {err ? <div className="error-box full-width">{err}</div> : null}
          {msg ? <div className="success-box full-width">{msg}</div> : null}

          <div className="full-width">
            <button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "create"
                ? "Create Portal Access"
                : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}