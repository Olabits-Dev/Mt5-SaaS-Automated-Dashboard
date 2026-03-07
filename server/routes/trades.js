const express = require("express");
const { pool } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM trades ORDER BY COALESCE(updated_at, opened_at) DESC LIMIT 200`
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /trades error", err);
    return res.status(500).json({ error: "Failed to fetch trades" });
  }
});

router.post("/ingest", async (req, res) => {
  try {
    const {
      client_id,
      symbol,
      side,
      volume,
      entry_price,
      sl,
      tp,
      pnl = 0,
      status = "OPEN",
      ticket,
      opened_at,
      closed_at = null,
    } = req.body;

    if (!client_id || !ticket) {
      return res.status(400).json({ error: "client_id and ticket are required" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO trades
      (
        client_id, symbol, side, volume, entry_price, sl, tp,
        pnl, status, ticket, opened_at, closed_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
      ON CONFLICT (client_id, ticket)
      DO UPDATE SET
        symbol = EXCLUDED.symbol,
        side = EXCLUDED.side,
        volume = EXCLUDED.volume,
        entry_price = EXCLUDED.entry_price,
        sl = EXCLUDED.sl,
        tp = EXCLUDED.tp,
        pnl = EXCLUDED.pnl,
        status = EXCLUDED.status,
        opened_at = COALESCE(trades.opened_at, EXCLUDED.opened_at),
        closed_at = EXCLUDED.closed_at,
        updated_at = NOW()
      RETURNING *
      `,
      [
        client_id,
        symbol,
        side,
        volume,
        entry_price,
        sl,
        tp,
        pnl,
        status,
        String(ticket),
        opened_at || null,
        closed_at,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /trades/ingest error", err);
    return res.status(500).json({ error: "Failed to ingest trade" });
  }
});

module.exports = router;