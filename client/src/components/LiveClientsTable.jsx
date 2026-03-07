import React from "react";

export default function LiveClientsTable({ rows }) {
  return (
    <div className="card">
      <h3>Live Client View</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Login</th>
              <th>Server</th>
              <th>Balance</th>
              <th>Equity</th>
              <th>Floating PnL</th>
              <th>DD Limit</th>
              <th>Positions</th>
              <th>Status</th>
              <th>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name || "-"}</td>
                <td>{r.mt5_login || "-"}</td>
                <td>{r.mt5_server || "-"}</td>
                <td>{r.balance}</td>
                <td>{r.equity}</td>
                <td>{r.floating_pnl}</td>
                <td>{r.dd_limit_pct}%</td>
                <td>{r.active_positions}</td>
                <td>{r.status}</td>
                <td>{r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}