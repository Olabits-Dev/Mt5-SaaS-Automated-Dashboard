import React from "react"; 
export default function BotStatusCard({ status }) {
  return (
    <div className="card">
      <h3>Bot Status</h3>
      {!status ? (
        <p>No heartbeat yet</p>
      ) : (
        <div>
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Machine:</strong> {status.source_machine}</p>
          <p><strong>Heartbeat:</strong> {new Date(status.heartbeat_at).toLocaleString()}</p>
          <p><strong>Note:</strong> {status.note || "-"}</p>
        </div>
      )}
    </div>
  );
}