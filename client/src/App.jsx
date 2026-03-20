import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";

export default function App() {
  const [mode, setMode] = useState("admin");
  const [adminAuth, setAdminAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth")) || null;
    } catch {
      return null;
    }
  });

  const [clientAuth, setClientAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("client_auth")) || null;
    } catch {
      return null;
    }
  });

  function handleAdminLogin(data) {
    localStorage.setItem("auth", JSON.stringify(data));
    setAdminAuth(data);
  }

  function handleClientLogin(data) {
    localStorage.setItem("client_auth", JSON.stringify(data));
    setClientAuth(data);
  }

  function handleAdminLogout() {
    localStorage.removeItem("auth");
    setAdminAuth(null);
  }

  function handleClientLogout() {
    localStorage.removeItem("client_auth");
    setClientAuth(null);
  }

  if (mode === "client") {
    return clientAuth ? (
      <ClientDashboardPage auth={clientAuth} onLogout={handleClientLogout} />
    ) : (
      <div>
        <div className="page">
          <div className="card">
            <div className="modal-header">
              <h2>MT5 SaaS Portal</h2>
              <button className="secondary-btn" onClick={() => setMode("admin")}>
                Switch to Admin
              </button>
            </div>
          </div>
        </div>
        <ClientLoginPage onLogin={handleClientLogin} />
      </div>
    );
  }

  return adminAuth ? (
    <div>
      <div className="page">
        <div className="card">
          <div className="modal-header">
            <h2>MT5 SaaS Admin</h2>
            <button className="secondary-btn" onClick={() => setMode("client")}>
              Open Client Portal
            </button>
          </div>
        </div>
      </div>
      <DashboardPage auth={adminAuth} onLogout={handleAdminLogout} />
    </div>
  ) : (
    <div>
      <div className="page">
        <div className="card">
          <div className="modal-header">
            <h2>MT5 SaaS Platform</h2>
            <button className="secondary-btn" onClick={() => setMode("client")}>
              Client Portal
            </button>
          </div>
        </div>
      </div>
      <LoginPage onLogin={handleAdminLogin} />
    </div>
  );
}