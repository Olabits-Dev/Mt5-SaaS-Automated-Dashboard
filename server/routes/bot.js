const express = require("express");
const { pool } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();
let bootstrapped = false;

async function ensureSignalLogsTable() {
  if (bootstrapped) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_signal_logs (
      id BIGSERIAL PRIMARY KEY,
      client_id BIGINT NULL,
      client_name TEXT NULL,
      symbol TEXT NULL,
      signal TEXT NULL,
      strategy TEXT NULL,
      reason TEXT NULL,
      tf TEXT NULL,
      session TEXT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  bootstrapped = true;
}

router.get("/status", authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, heartbeat_at, source_machine, status, note
       FROM bot_status
       ORDER BY heartbeat_at DESC
       LIMIT 1`
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error("GET /bot/status error", err);
    return res.status(500).json({ error: "Failed to fetch bot status" });
  }
});

router.post("/heartbeat", async (req, res) => {
  try {
    const {
      source_machine = "unknown",
      status = "running",
      note = "",
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO bot_status (heartbeat_at, source_machine, status, note)
       VALUES (NOW(), $1, $2, $3)
       RETURNING *`,
      [source_machine, status, note]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /bot/heartbeat error", err);
    return res.status(500).json({ error: "Failed to save heartbeat" });
  }
});

async function insertSignalLog(req, res) {
  try {
    await ensureSignalLogsTable();

    const payload = req.body || {};
    const rawLoggedAt = payload.logged_at || new Date().toISOString();
    const loggedAt = Number.isNaN(new Date(rawLoggedAt).getTime()) ? new Date().toISOString() : rawLoggedAt;

    const { rows } = await pool.query(
      `INSERT INTO bot_signal_logs
      (client_id, client_name, symbol, signal, strategy, reason, tf, session, payload, logged_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
      RETURNING *`,
      [
        payload.client_id ? Number(payload.client_id) : null,
        payload.client_name ? String(payload.client_name) : null,
        payload.symbol ? String(payload.symbol) : null,
        payload.signal ? String(payload.signal).toUpperCase() : null,
        payload.strategy ? String(payload.strategy) : null,
        payload.reason ? String(payload.reason) : null,
        payload.tf ? String(payload.tf) : null,
        payload.session ? String(payload.session) : null,
        JSON.stringify(payload),
        loggedAt,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /bot/signal-log error", err);
    return res.status(500).json({ error: "Failed to save signal log" });
  }
}

router.post("/signal-log", insertSignalLog);
router.post("/signal-logs", insertSignalLog);

router.get("/signal-logs", authRequired, adminOnly, async (req, res) => {
  try {
    await ensureSignalLogsTable();
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const { rows } = await pool.query(
      `SELECT sl.*, c.name AS linked_client_name
       FROM bot_signal_logs sl
       LEFT JOIN clients c ON c.id = sl.client_id
       ORDER BY sl.logged_at DESC, sl.id DESC
       LIMIT $1`,
      [limit]
    );

    return res.json(rows.map((row) => ({
      ...row,
      client_name: row.client_name || row.linked_client_name || null,
    })));
  } catch (err) {
    console.error("GET /bot/signal-logs error", err);
    return res.status(500).json({ error: "Failed to fetch signal logs" });
  }
});

module.exports = router;
