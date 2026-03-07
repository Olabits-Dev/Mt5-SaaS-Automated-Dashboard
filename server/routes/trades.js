const express = require("express");
const { pool } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableText(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function toTradeStatus(value) {
  const s = String(value || "OPEN").trim().toUpperCase();
  return ["OPEN", "CLOSED", "CANCELLED", "REJECTED"].includes(s) ? s : "OPEN";
}

router.get("/", authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM trades
      ORDER BY COALESCE(updated_at, closed_at, opened_at, created_at) DESC
      LIMIT 200
      `
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
    } = req.body || {};

    if (!client_id || !ticket) {
      return res.status(400).json({ error: "client_id and ticket are required" });
    }

    const cleanClientId = Number(client_id);
    const cleanTicket = String(ticket).trim();

    if (!Number.isFinite(cleanClientId) || cleanClientId <= 0) {
      return res.status(400).json({ error: "client_id must be a valid number" });
    }

    if (!cleanTicket) {
      return res.status(400).json({ error: "ticket must be a non-empty string" });
    }

    const cleanSymbol = toNullableText(symbol);
    const cleanSide = toNullableText(side ? String(side).toUpperCase() : null);
    const cleanVolume = toNum(volume, 0);
    const cleanEntryPrice = toNum(entry_price, 0);
    const cleanSl = toNum(sl, 0);
    const cleanTp = toNum(tp, 0);
    const cleanPnl = toNum(pnl, 0);
    const cleanStatus = toTradeStatus(status);
    const cleanOpenedAt = opened_at || null;
    const cleanClosedAt = cleanStatus === "CLOSED" ? (closed_at || new Date().toISOString()) : closed_at;

    const { rows } = await pool.query(
      `
      INSERT INTO trades
      (
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
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
      ON CONFLICT (client_id, ticket)
      DO UPDATE SET
        symbol = COALESCE(EXCLUDED.symbol, trades.symbol),
        side = COALESCE(EXCLUDED.side, trades.side),
        volume = CASE
          WHEN EXCLUDED.volume IS NOT NULL AND EXCLUDED.volume <> 0 THEN EXCLUDED.volume
          ELSE trades.volume
        END,
        entry_price = CASE
          WHEN EXCLUDED.entry_price IS NOT NULL AND EXCLUDED.entry_price <> 0 THEN EXCLUDED.entry_price
          ELSE trades.entry_price
        END,
        sl = CASE
          WHEN EXCLUDED.sl IS NOT NULL AND EXCLUDED.sl <> 0 THEN EXCLUDED.sl
          ELSE trades.sl
        END,
        tp = CASE
          WHEN EXCLUDED.tp IS NOT NULL AND EXCLUDED.tp <> 0 THEN EXCLUDED.tp
          ELSE trades.tp
        END,
        pnl = EXCLUDED.pnl,
        status = EXCLUDED.status,
        opened_at = COALESCE(trades.opened_at, EXCLUDED.opened_at),
        closed_at = CASE
          WHEN EXCLUDED.status = 'CLOSED' THEN COALESCE(EXCLUDED.closed_at, trades.closed_at, NOW())
          ELSE trades.closed_at
        END,
        updated_at = NOW()
      RETURNING *
      `,
      [
        cleanClientId,
        cleanSymbol,
        cleanSide,
        cleanVolume,
        cleanEntryPrice,
        cleanSl,
        cleanTp,
        cleanPnl,
        cleanStatus,
        cleanTicket,
        cleanOpenedAt,
        cleanClosedAt,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /trades/ingest error", err);
    return res.status(500).json({ error: "Failed to ingest trade" });
  }
});

module.exports = router;
