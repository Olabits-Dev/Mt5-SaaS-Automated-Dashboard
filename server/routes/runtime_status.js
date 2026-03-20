const express = require("express");
const { pool } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        rs.*,
        c.name
      FROM client_runtime_status rs
      LEFT JOIN clients c ON c.id = rs.client_id
      ORDER BY rs.last_sync_at DESC
      `
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /runtime-status error", err);
    return res.status(500).json({ error: "Failed to fetch runtime status" });
  }
});

router.post("/upsert", async (req, res) => {
  try {
    const {
      client_id,
      mt5_login,
      mt5_server,
      balance = 0,
      equity = 0,
      floating_pnl = 0,
      dd_limit_pct = 5,
      active_positions = 0,
      status = "running",
      note = "",
    } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: "client_id is required" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO client_runtime_status
      (
        client_id, mt5_login, mt5_server, balance, equity, floating_pnl,
        dd_limit_pct, active_positions, status, note, last_sync_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      ON CONFLICT (client_id)
      DO UPDATE SET
        mt5_login = EXCLUDED.mt5_login,
        mt5_server = EXCLUDED.mt5_server,
        balance = EXCLUDED.balance,
        equity = EXCLUDED.equity,
        floating_pnl = EXCLUDED.floating_pnl,
        dd_limit_pct = EXCLUDED.dd_limit_pct,
        active_positions = EXCLUDED.active_positions,
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        last_sync_at = NOW()
      RETURNING *
      `,
      [
        client_id,
        mt5_login ? String(mt5_login) : null,
        mt5_server ? String(mt5_server) : null,
        Number(balance || 0),
        Number(equity || 0),
        Number(floating_pnl || 0),
        Number(dd_limit_pct || 5),
        Number(active_positions || 0),
        status,
        note,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /runtime-status/upsert error", err);
    return res.status(500).json({ error: "Failed to upsert runtime status" });
  }
});

module.exports = router;