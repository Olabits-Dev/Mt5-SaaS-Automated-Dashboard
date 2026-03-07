import React from "react";

export default function ClientsTable({
  clients,
  onEdit,
  onDelete,
  onPortalAccess,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="card">
      <div className="clients-toolbar">
        <div>
          <h3>Clients</h3>
        </div>

        <div className="clients-controls">
          <input
            className="toolbar-input"
            placeholder="Search name, login, server..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />

          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange && onStatusFilterChange(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>MT5 Login</th>
              <th>Plan</th>
              <th>Billing</th>
              <th>Paid</th>
              <th>Payment</th>
              <th>Portal</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="10">No clients found.</td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.mt5_login || "-"}</td>
                  <td>{c.plan_name || "-"}</td>
                  <td>{c.billing_cycle || "-"}</td>
                  <td>{c.amount_paid || 0}</td>
                  <td>{c.payment_status || "UNPAID"}</td>
                  <td>{c.portal_email || (c.user_id ? "Linked" : "No Access")}</td>
                  <td>{c.expiry_date || "-"}</td>
                  <td>{c.active ? "ACTIVE" : "DISABLED"}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="secondary-btn" onClick={() => onEdit && onEdit(c)}>
                        Edit
                      </button>

                      <button className="secondary-btn" onClick={() => onPortalAccess && onPortalAccess(c)}>
                        {c.user_id ? "Reset Portal" : "Create Portal"}
                      </button>

                      <button className="danger-btn" onClick={() => onDelete && onDelete(c)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}