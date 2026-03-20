const express = require("express");
const { pool } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function clientOnly(req, res, next) {
  if (!req.user || req.user.role !== "client") {
    return res.status(403).json({ error: "Client access only" });
  }
  next();
}

router.get("/me", authRequired, clientOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.mt5_login,
         c.mt5_server,
         c.expiry_date,
         c.active,
         c.dd_limit_pct,
         c.allowed_pairs_json,
         c.plan_name,
         c.billing_cycle,
         c.amount_paid,
         c.payment_status,
         c.subscription_start_date,
         c.notes,
         c.created_at
       FROM clients c
       WHERE c.user_id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Client profile not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("GET /client-portal/me error", err);
    return res.status(500).json({ error: "Failed to load client profile" });
  }
});

router.get("/runtime", authRequired, clientOnly, async (req, res) => {
  try {
    const clientRes = await pool.query(
      `SELECT id FROM clients WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    const client = clientRes.rows[0];
    if (!client) {
      return res.status(404).json({ error: "Client profile not found" });
    }

    const { rows } = await pool.query(
      `SELECT *
       FROM client_runtime_status
       WHERE client_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [client.id]
    );

    return res.json(rows[0] || null);
  } catch (err) {
    console.error("GET /client-portal/runtime error", err);
    return res.status(500).json({ error: "Failed to load runtime status" });
  }
});

router.get("/trades", authRequired, clientOnly, async (req, res) => {
  try {
    const clientRes = await pool.query(
      `SELECT id FROM clients WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    const client = clientRes.rows[0];
    if (!client) {
      return res.status(404).json({ error: "Client profile not found" });
    }

    const { rows } = await pool.query(
      `SELECT
         id,
         client_id,
         symbol,
         side,
         volume,
         entry_price,
         sl,
         tp,
         pnl,
         status,
         ticket,
         opened_at,
         closed_at,
         created_at
       FROM trades
       WHERE client_id = $1
       ORDER BY COALESCE(opened_at, created_at) DESC
       LIMIT 100`,
      [client.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("GET /client-portal/trades error", err);
    return res.status(500).json({ error: "Failed to load client trades" });
  }
});

module.exports = router;