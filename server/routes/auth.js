const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set; using fallback secret. Set JWT_SECRET in production for security.");
}

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let ok = false;
    try {
      ok = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error("bcrypt compare error", { email, error: error.message });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signUser(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("POST /auth/login error", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/client-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1 AND role = 'client'
       LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid client credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid client credentials" });
    }

    const link = await pool.query(
      `SELECT id, name
       FROM clients
       WHERE user_id = $1
       LIMIT 1`,
      [user.id]
    );

    if (!link.rows[0]) {
      return res.status(403).json({ error: "No client profile linked to this user" });
    }

    const token = signUser(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      client: link.rows[0],
    });
  } catch (err) {
    console.error("POST /auth/client-login error", err);
    return res.status(500).json({ error: "Client login failed" });
  }
});

module.exports = router;