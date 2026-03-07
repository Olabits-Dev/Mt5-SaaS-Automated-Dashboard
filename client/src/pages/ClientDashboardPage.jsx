import React, { useEffect, useState } from "react";
import { api, setAuthToken } from "../api";

export default function ClientDashboardPage({ auth, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setAuthToken(auth?.token || null);
      setError("");

      const [profileRes, runtimeRes, tradesRes] = await Promise.all([
        api.get("/client-portal/me"),
        api.get("/client-portal/runtime"),
        api.get("/client-portal/trades"),
      ]);

      setProfile(profileRes.data || null);
      setRuntime(runtimeRes.data || null);
      setTrades(tradesRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load client portal");
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page">
      <div className="card">
        <div className="modal-header">
          <div>
            <h2>Client Portal</h2>
            <p>Welcome, {auth?.user?.name}</p>
          </div>
          <button className="secondary-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {profile ? (
        <div className="grid-2">
          <div className="card">
            <h3>Subscription</h3>
            <p><strong>Plan:</strong> {profile.plan_name || "-"}</p>
            <p><strong>Billing:</strong> {profile.billing_cycle || "-"}</p>
            <p><strong>Payment:</strong> {profile.payment_status || "-"}</p>
            <p><strong>Amount Paid:</strong> {profile.amount_paid || 0}</p>
            <p><strong>Expiry:</strong> {profile.expiry_date || "-"}</p>
            <p><strong>Status:</strong> {profile.active ? "ACTIVE" : "DISABLED"}</p>
          </div>

          <div className="card">
            <h3>Trading Account</h3>
            <p><strong>MT5 Login:</strong> {profile.mt5_login || "-"}</p>
            <p><strong>Server:</strong> {profile.mt5_server || "-"}</p>
            <p><strong>DD Limit:</strong> {profile.dd_limit_pct || 0}%</p>
            <p>
              <strong>Allowed Pairs:</strong>{" "}
              {Array.isArray(profile.allowed_pairs_json)
                ? profile.allowed_pairs_json.join(", ")
                : profile.allowed_pairs_json || "ALL"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>Bot Runtime</h3>
        {runtime ? (
          <div className="grid-2">
            <p><strong>Status:</strong> {runtime.status || "-"}</p>
            <p><strong>Balance:</strong> {runtime.balance || 0}</p>
            <p><strong>Equity:</strong> {runtime.equity || 0}</p>
            <p><strong>Floating PnL:</strong> {runtime.floating_pnl || 0}</p>
            <p><strong>Open Positions:</strong> {runtime.active_positions || 0}</p>
            <p><strong>Last Update:</strong> {runtime.updated_at || "-"}</p>
          </div>
        ) : (
          <p>No runtime status yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Recent Trades</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Volume</th>
                <th>Status</th>
                <th>PnL</th>
                <th>Opened</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan="7">No trades found.</td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id}>
                    <td>{t.symbol}</td>
                    <td>{t.side}</td>
                    <td>{t.volume}</td>
                    <td>{t.status}</td>
                    <td>{t.pnl}</td>
                    <td>{t.opened_at || "-"}</td>
                    <td>{t.closed_at || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}