const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { pool } = require("./db");
const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const botRoutes = require("./routes/bot");
const tradeRoutes = require("./routes/trades");
const runtimeStatusRoutes = require("./routes/runtime_status");
const clientPortalRoutes = require("./routes/client_portal");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://olabitsmt5-saas.vercel.app",
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(",").map((item) => item.trim()))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const initPromise = start();
async function requireInit(req, res, next) {
  try {
    await initPromise;
    next();
  } catch (err) {
    console.error("Server initialization failed", err);
    res.status(500).json({ error: "Server initialization failed" });
  }
}

app.use(requireInit);

app.get("/", (req, res) => {
  res.send("MT5 SaaS Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "mt5-saas-server" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/bot", botRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/runtime-status", runtimeStatusRoutes);
app.use("/api/client-portal", clientPortalRoutes);

async function ensureSchema() {
  const schemaPath = path.join(__dirname, "sql", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  await pool.query(schemaSql);

  await pool.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS mt5_password TEXT,
      ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(18,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS portal_email TEXT;

    ALTER TABLE trades
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

    CREATE UNIQUE INDEX IF NOT EXISTS trades_client_ticket_uniq ON trades(client_id, ticket);

    CREATE TABLE IF NOT EXISTS client_runtime_status (
      id SERIAL PRIMARY KEY,
      client_id INTEGER UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
      mt5_login TEXT,
      mt5_server TEXT,
      balance NUMERIC(18,2) DEFAULT 0,
      equity NUMERIC(18,2) DEFAULT 0,
      floating_pnl NUMERIC(18,2) DEFAULT 0,
      dd_limit_pct NUMERIC(10,2) DEFAULT 5.00,
      active_positions INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      note TEXT,
      last_sync_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Database schema ensured");
}

async function ensureAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = String(process.env.ADMIN_PASSWORD || "").trim();

  if (!email || !password) {
    console.log("Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD missing");
    return;
  }

  const existing = await pool.query(
    "SELECT id FROM users WHERE email=$1 LIMIT 1",
    [email]
  );

  if (existing.rows.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    ["Admin", email, passwordHash, "admin"]
  );

  console.log("✅ Admin user seeded:", email);
}

async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined");
    }
    if (!process.env.JWT_SECRET) {
      console.warn("WARNING: JWT_SECRET is not set; using fallback secret for token signing.");
    }

    await pool.query("SELECT NOW()");
    await ensureSchema();
    await ensureAdminUser();

    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log("✅ Allowed CORS origins:", allowedOrigins);
      });
    }
  } catch (err) {
    console.error("Server startup error", err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

start();

module.exports = app;