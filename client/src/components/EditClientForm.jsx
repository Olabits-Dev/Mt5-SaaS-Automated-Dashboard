import React, { useEffect, useState } from "react";
import { api } from "../api";
import { ALL_SYMBOLS, DERIV_SYMBOLS, FX_SYMBOLS } from "../constants/pairs";

export default function EditClientForm({ client, onUpdated, onClose }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    mt5_login: "",
    mt5_password: "",
    mt5_server: "",
    expiry_date: "",
    active: true,
    dd_limit_pct: 5,
    allowed_pairs_json: [],
    plan_name: "monthly",
    billing_cycle: "monthly",
    amount_paid: 0,
    payment_status: "UNPAID",
    subscription_start_date: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!client) return;

    setForm({
      id: client.id,
      name: client.name || "",
      mt5_login: client.mt5_login || "",
      mt5_password: client.mt5_password || "",
      mt5_server: client.mt5_server || "",
      expiry_date: client.expiry_date || "",
      active: !!client.active,
      dd_limit_pct: client.dd_limit_pct ?? 5,
      allowed_pairs_json: Array.isArray(client.allowed_pairs_json)
        ? client.allowed_pairs_json
        : [],
      plan_name: client.plan_name || "monthly",
      billing_cycle: client.billing_cycle || "monthly",
      amount_paid: client.amount_paid ?? 0,
      payment_status: client.payment_status || "UNPAID",
      subscription_start_date: client.subscription_start_date || "",
      notes: client.notes || "",
    });

    setMsg("");
    setErr("");
  }, [client]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePair(symbol) {
    setForm((prev) => {
      const current = Array.isArray(prev.allowed_pairs_json)
        ? prev.allowed_pairs_json
        : [];

      const exists = current.includes(symbol);

      return {
        ...prev,
        allowed_pairs_json: exists
          ? current.filter((item) => item !== symbol)
          : [...current, symbol],
      };
    });
  }

  function selectAllPairs() {
    setForm((prev) => ({
      ...prev,
      allowed_pairs_json: [...ALL_SYMBOLS],
    }));
  }

  function selectFxOnly() {
    setForm((prev) => ({
      ...prev,
      allowed_pairs_json: [...FX_SYMBOLS],
    }));
  }

  function selectDerivOnly() {
    setForm((prev) => ({
      ...prev,
      allowed_pairs_json: [...DERIV_SYMBOLS],
    }));
  }

  function clearAllPairs() {
    setForm((prev) => ({
      ...prev,
      allowed_pairs_json: [],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErr("");

    try {
      const payload = {
        name: form.name,
        mt5_login: form.mt5_login,
        mt5_password: form.mt5_password,
        mt5_server: form.mt5_server,
        expiry_date: form.expiry_date || null,
        active: !!form.active,
        dd_limit_pct: Number(form.dd_limit_pct || 5),
        allowed_pairs_json: Array.isArray(form.allowed_pairs_json)
          ? form.allowed_pairs_json
          : [],
        plan_name: form.plan_name,
        billing_cycle: form.billing_cycle,
        amount_paid: Number(form.amount_paid || 0),
        payment_status: form.payment_status,
        subscription_start_date: form.subscription_start_date || null,
        notes: form.notes || "",
      };

      const { data } = await api.put(`/clients/${form.id}`, payload);
      setMsg("Client updated successfully.");
      if (onUpdated) onUpdated(data);
    } catch (error) {
      setErr(error?.response?.data?.error || "Failed to update client");
    } finally {
      setLoading(false);
    }
  }

  if (!client) return null;

  const selectedCount = Array.isArray(form.allowed_pairs_json)
    ? form.allowed_pairs_json.length
    : 0;

  return (
    <div className="modal-backdrop">
      <div className="card modal-card">
        <div className="modal-header">
          <h3>Edit Client</h3>
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>Client Name</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label>MT5 Login</label>
            <input
              value={form.mt5_login}
              onChange={(e) => updateField("mt5_login", e.target.value)}
            />
          </div>

          <div>
            <label>MT5 Password</label>
            <input
              type="password"
              value={form.mt5_password}
              onChange={(e) => updateField("mt5_password", e.target.value)}
            />
          </div>

          <div>
            <label>MT5 Server</label>
            <input
              value={form.mt5_server}
              onChange={(e) => updateField("mt5_server", e.target.value)}
            />
          </div>

          <div>
            <label>Expiry Date</label>
            <input
              type="date"
              value={form.expiry_date || ""}
              onChange={(e) => updateField("expiry_date", e.target.value)}
            />
          </div>

          <div>
            <label>DD Limit %</label>
            <input
              type="number"
              step="0.1"
              value={form.dd_limit_pct}
              onChange={(e) => updateField("dd_limit_pct", e.target.value)}
            />
          </div>

          <div>
            <label>Plan</label>
            <input
              value={form.plan_name}
              onChange={(e) => updateField("plan_name", e.target.value)}
            />
          </div>

          <div>
            <label>Billing Cycle</label>
            <select
              value={form.billing_cycle}
              onChange={(e) => updateField("billing_cycle", e.target.value)}
            >
              <option value="monthly">monthly</option>
              <option value="quarterly">quarterly</option>
              <option value="yearly">yearly</option>
              <option value="lifetime">lifetime</option>
            </select>
          </div>

          <div>
            <label>Amount Paid</label>
            <input
              type="number"
              step="0.01"
              value={form.amount_paid}
              onChange={(e) => updateField("amount_paid", e.target.value)}
            />
          </div>

          <div>
            <label>Payment Status</label>
            <select
              value={form.payment_status}
              onChange={(e) => updateField("payment_status", e.target.value)}
            >
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>

          <div>
            <label>Subscription Start</label>
            <input
              type="date"
              value={form.subscription_start_date || ""}
              onChange={(e) => updateField("subscription_start_date", e.target.value)}
            />
          </div>

          <div>
            <label>Status</label>
            <select
              value={form.active ? "active" : "disabled"}
              onChange={(e) => updateField("active", e.target.value === "active")}
            >
              <option value="active">ACTIVE</option>
              <option value="disabled">DISABLED</option>
            </select>
          </div>

          <div className="full-width">
            <label>Allowed Pairs</label>

            <div className="pairs-actions">
              <button type="button" onClick={selectAllPairs}>
                Select All
              </button>
              <button type="button" onClick={selectFxOnly}>
                FX Only
              </button>
              <button type="button" onClick={selectDerivOnly}>
                Deriv Only
              </button>
              <button type="button" onClick={clearAllPairs}>
                Clear All
              </button>
            </div>

            <div className="pairs-panel">
              <div className="pairs-selected-count">
                <strong>Selected:</strong> {selectedCount}
              </div>

              <div className="pairs-section-title">
                <strong>FX / Core Pairs</strong>
              </div>
              <div className="pairs-grid pairs-grid-fx">
                {FX_SYMBOLS.map((symbol) => (
                  <label key={symbol} className="pair-option">
                    <input
                      type="checkbox"
                      checked={form.allowed_pairs_json.includes(symbol)}
                      onChange={() => togglePair(symbol)}
                    />
                    <span className="pair-option-text">{symbol}</span>
                  </label>
                ))}
              </div>

              <div className="pairs-section-title">
                <strong>Deriv Symbols</strong>
              </div>
              <div className="pairs-grid pairs-grid-deriv">
                {DERIV_SYMBOLS.map((symbol) => (
                  <label key={symbol} className="pair-option">
                    <input
                      type="checkbox"
                      checked={form.allowed_pairs_json.includes(symbol)}
                      onChange={() => togglePair(symbol)}
                    />
                    <span className="pair-option-text">{symbol}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="full-width">
            <label>Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          {err ? <div className="error-box full-width">{err}</div> : null}
          {msg ? <div className="success-box full-width">{msg}</div> : null}

          <div className="full-width">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form> 
      </div>
    </div>
  );
}
