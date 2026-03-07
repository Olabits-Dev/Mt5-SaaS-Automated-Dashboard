import React from "react";

export default function BillingSummaryCard({ clients }) {
  const totalRevenue = clients.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
  const paidCount = clients.filter((c) => c.payment_status === "PAID").length;
  const unpaidCount = clients.filter((c) => c.payment_status === "UNPAID").length;
  const partialCount = clients.filter((c) => c.payment_status === "PARTIAL").length;

  return (
    <div className="card">
      <h3>Subscription / Billing</h3>

      <div className="billing-grid">
        <div className="billing-box">
          <strong>Total Revenue</strong>
          <div>{totalRevenue.toFixed(2)}</div>
        </div>

        <div className="billing-box">
          <strong>Paid Clients</strong>
          <div>{paidCount}</div>
        </div>

        <div className="billing-box">
          <strong>Partial</strong>
          <div>{partialCount}</div>
        </div>

        <div className="billing-box">
          <strong>Unpaid</strong>
          <div>{unpaidCount}</div>
        </div>
      </div>
    </div>
  );
}