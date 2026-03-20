import React from "react";
export default function Header({ user, onLogout }) {
  return (
    <header className="header card">
      <div>
        <h2>MT5 SaaS Admin Dashboard</h2>
        <p>Welcome, {user?.name || "Admin"}</p>
      </div>
      <button onClick={onLogout}>Logout</button>
    </header>
  );
}