import React from "react";

function badgeStyle(signal) {
  const s = String(signal || "").toUpperCase();
  if (s === "BUY") return { background: "#ecfdf3", color: "#067647", border: "1px solid #abefc6" };
  if (s === "SELL") return { background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca" };
  return { background: "#f2f4f7", color: "#344054", border: "1px solid #d0d5dd" };
}

export default function SignalLogsTable({ rows }) {
  return (
    <div className="card">
      <div className="clients-toolbar">
        <div>
          <h3>Signal Logs</h3>
          <p className="muted-text">Latest strategy decisions from the bot, including Deriv and XAUUSD reviews.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Client</th>
              <th>Symbol</th>
              <th>Signal</th>
              <th>TF</th>
              <th>Strategy</th>
              <th>Reason</th>
              <th>Session</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="8">No signal logs yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.logged_at ? new Date(row.logged_at).toLocaleString() : "-"}</td>
                  <td>{row.client_name || row.client_id || "GLOBAL"}</td>
                  <td>{row.symbol || "-"}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        ...badgeStyle(row.signal),
                      }}
                    >
                      {row.signal || "NONE"}
                    </span>
                  </td>
                  <td>{row.tf || "-"}</td>
                  <td>{row.strategy || "-"}</td>
                  <td>{row.reason || "-"}</td>
                  <td>{row.session || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
