const express = require("express");
const { pool } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/", authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         name,
         mt5_login,
         mt5_password,
         mt5_server,
         expiry_date,
         active,
         dd_limit_pct,
         allowed_pairs_json,
         plan_name,
         billing_cycle,
         amount_paid,
         payment_status,
         subscription_start_date,
         notes,
         created_at
       FROM clients
       ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /clients error", err);
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/:id", authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         name,
         mt5_login,
         mt5_password,
         mt5_server,
         expiry_date,
         active,
         dd_limit_pct,
         allowed_pairs_json,
         plan_name,
         billing_cycle,
         amount_paid,
         payment_status,
         subscription_start_date,
         notes,
         created_at
       FROM clients
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("GET /clients/:id error", err);
    return res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/", authRequired, adminOnly, async (req, res) => {
  try {
    const {
      name,
      mt5_login,
      mt5_password,
      mt5_server,
      expiry_date,
      active = true,
      dd_limit_pct = 5.0,
      allowed_pairs_json = [],
      plan_name = "monthly",
      billing_cycle = "monthly",
      amount_paid = 0,
      payment_status = "UNPAID",
      subscription_start_date = null,
      notes = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO clients
      (
        name,
        mt5_login,
        mt5_password,
        mt5_server,
        expiry_date,
        active,
        dd_limit_pct,
        allowed_pairs_json,
        plan_name,
        billing_cycle,
        amount_paid,
        payment_status,
        subscription_start_date,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING
        id,
        name,
        mt5_login,
        mt5_password,
        mt5_server,
        expiry_date,
        active,
        dd_limit_pct,
        allowed_pairs_json,
        plan_name,
        billing_cycle,
        amount_paid,
        payment_status,
        subscription_start_date,
        notes,
        created_at`,
      [
        String(name).trim(),
        mt5_login ? String(mt5_login).trim() : null,
        mt5_password ? String(mt5_password).trim() : null,
        mt5_server ? String(mt5_server).trim() : null,
        expiry_date || null,
        !!active,
        Number(dd_limit_pct || 5),
        JSON.stringify(Array.isArray(allowed_pairs_json) ? allowed_pairs_json : []),
        String(plan_name || "monthly").trim(),
        String(billing_cycle || "monthly").trim(),
        Number(amount_paid || 0),
        String(payment_status || "UNPAID").trim(),
        subscription_start_date || null,
        String(notes || ""),
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /clients error", err);
    return res.status(500).json({ error: "Failed to create client" });
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res) => {
  try {
    const {
      name,
      mt5_login,
      mt5_password,
      mt5_server,
      expiry_date,
      active,
      dd_limit_pct,
      allowed_pairs_json,
      plan_name,
      billing_cycle,
      amount_paid,
      payment_status,
      subscription_start_date,
      notes,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE clients
       SET
         name = $1,
         mt5_login = $2,
         mt5_password = $3,
         mt5_server = $4,
         expiry_date = $5,
         active = $6,
         dd_limit_pct = $7,
         allowed_pairs_json = $8,
         plan_name = $9,
         billing_cycle = $10,
         amount_paid = $11,
         payment_status = $12,
         subscription_start_date = $13,
         notes = $14
       WHERE id = $15
       RETURNING
         id,
         name,
         mt5_login,
         mt5_password,
         mt5_server,
         expiry_date,
         active,
         dd_limit_pct,
         allowed_pairs_json,
         plan_name,
         billing_cycle,
         amount_paid,
         payment_status,
         subscription_start_date,
         notes,
         created_at`,
      [
        name,
        mt5_login,
        mt5_password,
        mt5_server,
        expiry_date,
        active,
        dd_limit_pct,
        JSON.stringify(Array.isArray(allowed_pairs_json) ? allowed_pairs_json : []),
        plan_name,
        billing_cycle,
        Number(amount_paid || 0),
        payment_status,
        subscription_start_date,
        notes,
        req.params.id,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("PUT /clients/:id error", err);
    return res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM clients
       WHERE id = $1
       RETURNING id, name`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json({
      ok: true,
      deleted: rows[0],
    });
  } catch (err) {
    console.error("DELETE /clients/:id error", err);
    return res.status(500).json({ error: "Failed to delete client" });
  }
});

router.post("/:id/create-portal-user", authRequired, adminOnly, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { email, password, name } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const clientRes = await pool.query(
      `SELECT id, name, user_id
       FROM clients
       WHERE id = $1
       LIMIT 1`,
      [clientId]
    );

    const client = clientRes.rows[0];
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (client.user_id) {
      return res.status(400).json({ error: "Client already has a portal user linked" });
    }

    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    if (existingUser.rows[0]) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const userInsert = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'client')
       RETURNING id, name, email, role, created_at`,
      [
        String(name || client.name || "Client User").trim(),
        String(email).trim().toLowerCase(),
        passwordHash,
      ]
    );

    const user = userInsert.rows[0];

    await pool.query(
      `UPDATE clients
       SET user_id = $1
       WHERE id = $2`,
      [user.id, client.id]
    );

    return res.status(201).json({
      ok: true,
      message: "Client portal user created and linked successfully",
      user,
      client_id: client.id,
    });
  } catch (err) {
    console.error("POST /clients/:id/create-portal-user error", err);
    return res.status(500).json({ error: "Failed to create client portal user" });
  }
});

router.post("/:id/reset-portal-password", authRequired, adminOnly, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: "New password is required" });
    }

    const clientRes = await pool.query(
      `SELECT c.id, c.user_id, u.email
       FROM clients c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1
       LIMIT 1`,
      [clientId]
    );

    const client = clientRes.rows[0];
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (!client.user_id) {
      return res.status(400).json({ error: "This client has no linked portal user" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [passwordHash, client.user_id]
    );

    return res.json({
      ok: true,
      message: "Client portal password reset successfully",
      email: client.email,
    });
  } catch (err) {
    console.error("POST /clients/:id/reset-portal-password error", err);
    return res.status(500).json({ error: "Failed to reset client portal password" });
  }
});

module.exports = router;