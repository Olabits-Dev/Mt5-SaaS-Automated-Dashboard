const express = require("express");
const { pool } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

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

module.exports = router;