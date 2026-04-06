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
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

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
    await pool.query("SELECT NOW()");
    await ensureAdminUser();

    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log("✅ Allowed CORS origins:", allowedOrigins);
      });
    }
  } catch (err) {
    console.error("Server startup error", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;