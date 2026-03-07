import React, { useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import BotStatusCard from "../components/BotStatusCard";
import ClientsTable from "../components/ClientsTable";
import AddClientForm from "../components/AddClientForm";
import LiveClientsTable from "../components/LiveClientsTable";
import EditClientForm from "../components/EditClientForm";
import BillingSummaryCard from "../components/BillingSummaryCard";
import ClientPortalAccessForm from "../components/ClientPortalAccessForm";

export default function DashboardPage({ auth, onLogout }) {
  const [clients, setClients] = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [trades, setTrades] = useState([]);
  const [runtimeRows, setRuntimeRows] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [portalClient, setPortalClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setError("");
      setAuthToken(auth?.token || null);

      const [clientsRes, botRes, tradesRes, runtimeRes] = await Promise.all([
        api.get("/clients"),
        api.get("/bot/status"),
        api.get("/trades"),
        api.get("/runtime-status"),
      ]);

      setClients(clientsRes.data || []);
      setBotStatus(botRes.data || null);
      setTrades(tradesRes.data || []);
      setRuntimeRows(runtimeRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load dashboard data");
    }
  }

  useEffect(() => {
    if (auth?.token) {
      loadDashboard();
      const id = setInterval(loadDashboard, 15000);
      return () => clearInterval(id);
    }
  }, [auth]);

  function handleClientCreated(newClient) {
    setClients((prev) => [newClient, ...prev]);
  }

  function handleClientUpdated(updatedClient) {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    setEditingClient(null);
  }

  async function handleDeleteClient(client) {
    const yes = window.confirm(`Delete client "${client.name}"?`);
    if (!yes) return;

    try {
      await api.delete(`/clients/${client.id}`);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete client");
    }
  }

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.mt5_login || "").toLowerCase().includes(q) ||
        String(c.mt5_server || "").toLowerCase().includes(q) ||
        String(c.plan_name || "").toLowerCase().includes(q) ||
        String(c.payment_status || "").toLowerCase().includes(q) ||
        String(c.portal_email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && c.active) ||
        (statusFilter === "DISABLED" && !c.active);

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  return (
    <div className="page">
      <Header user={auth?.user} onLogout={onLogout} />

      {error ? <div className="error-box">{error}</div> : null}

      <div className="stats-grid">
        <StatCard title="Clients" value={clients.length} subtitle="Total onboarded" />
        <StatCard title="Trades" value={trades.length} subtitle="Recent records" />
        <StatCard title="Active Clients" value={clients.filter((c) => c.active).length} subtitle="Currently enabled" />
      </div>

      <div className="grid-2">
        <BotStatusCard status={botStatus} />
        <AddClientForm onCreated={handleClientCreated} />
      </div>

      <BillingSummaryCard clients={clients} />

      <div className="grid-2">
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
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td>{t.symbol}</td>
                    <td>{t.side}</td>
                    <td>{t.volume}</td>
                    <td>{t.status}</td>
                    <td>{t.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Sync Notes</h3>
          <p>Dashboard refreshes every 15 seconds.</p>
          <p>Bot heartbeat, client runtime status, trades, billing, and portal access now appear live.</p>
        </div>
      </div>

      <LiveClientsTable rows={runtimeRows} />

      <ClientsTable
        clients={filteredClients}
        onEdit={(client) => setEditingClient(client)}
        onDelete={handleDeleteClient}
        onPortalAccess={(client) => setPortalClient(client)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {editingClient ? (
        <EditClientForm
          client={editingClient}
          onUpdated={handleClientUpdated}
          onClose={() => setEditingClient(null)}
        />
      ) : null}

      {portalClient ? (
        <ClientPortalAccessForm
          client={portalClient}
          onClose={() => setPortalClient(null)}
          onDone={loadDashboard}
        />
      ) : null}
    </div>
  );
}