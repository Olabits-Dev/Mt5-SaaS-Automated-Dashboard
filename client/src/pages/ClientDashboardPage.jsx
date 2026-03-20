import React, { useEffect, useState } from "react";
import { api, setAuthToken } from "../api";

export default function ClientDashboardPage({ auth, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState("");

  function formatMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function getStatusBadgeStyle(status) {
    const s = String(status || "").toUpperCase();

    if (s === "OPEN") {
      return {
        background: "#ecfdf3",
        color: "#067647",
        border: "1px solid #abefc6",
      };
    }

    if (s === "CLOSED") {
      return {
        background: "#eff8ff",
        color: "#175cd3",
        border: "1px solid #b2ddff",
      };
    }

    if (s === "ACTIVE") {
      return {
        background: "#ecfdf3",
        color: "#067647",
        border: "1px solid #abefc6",
      };
    }

    if (s === "DISABLED" || s === "EXPIRED" || s === "BLOCKED") {
      return {
        background: "#fef3f2",
        color: "#b42318",
        border: "1px solid #fecdca",
      };
    }

    return {
      background: "#f2f4f7",
      color: "#344054",
      border: "1px solid #d0d5dd",
    };
  }

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
            <p><strong>Amount Paid:</strong> {formatMoney(profile.amount_paid || 0)}</p>
            <p><strong>Expiry:</strong> {formatDate(profile.expiry_date)}</p>
            <div style={{ marginTop: "10px" }}>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginLeft: "6px",
                  ...getStatusBadgeStyle(profile.active ? "ACTIVE" : "DISABLED"),
                }}
              >
                {profile.active ? "ACTIVE" : "DISABLED"}
              </span>
            </div>
          </div>

          <div className="card">
            <h3>Trading Account</h3>
            <p><strong>MT5 Login:</strong> {profile.mt5_login || "-"}</p>
            <p><strong>Server:</strong> {profile.mt5_server || "-"}</p>
            <p><strong>DD Limit:</strong> {profile.dd_limit_pct || 0}%</p>

            <div style={{ marginTop: "12px" }}>
              <strong>Allowed Pairs:</strong>
              {Array.isArray(profile.allowed_pairs_json) && profile.allowed_pairs_json.length > 0 ? (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {profile.allowed_pairs_json.map((pair) => (
                    <span
                      key={pair}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#f3f4f6",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              ) : (
                <span> ALL</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3>Bot Runtime</h3>
        {runtime ? (
          <div className="grid-2">
            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  ...getStatusBadgeStyle(runtime.status),
                }}
              >
                {runtime.status || "-"}
              </span>
            </p>
            <p><strong>Balance:</strong> {formatMoney(runtime.balance || 0)}</p>
            <p><strong>Equity:</strong> {formatMoney(runtime.equity || 0)}</p>
            <p><strong>Floating PnL:</strong> {formatMoney(runtime.floating_pnl || 0)}</p>
            <p><strong>Open Positions:</strong> {runtime.active_positions || 0}</p>
            <p><strong>Last Update:</strong> {formatDate(runtime.last_sync_at || runtime.updated_at)}</p>
            <p><strong>Runtime Note:</strong> {runtime.note || "-"}</p>
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
                trades.map((t) => {
                  const pnlValue = Number(t.pnl || 0);
                  const pnlPositive = pnlValue >= 0;

                  return (
                    <tr key={t.id}>
                      <td>{t.symbol || "-"}</td>
                      <td>{t.side || "-"}</td>
                      <td>{t.volume || 0}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            ...getStatusBadgeStyle(t.status),
                          }}
                        >
                          {t.status || "-"}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: pnlPositive ? "#067647" : "#b42318",
                        }}
                      >
                        {formatMoney(pnlValue)}
                      </td>
                      <td>{formatDate(t.opened_at)}</td>
                      <td>{formatDate(t.closed_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}