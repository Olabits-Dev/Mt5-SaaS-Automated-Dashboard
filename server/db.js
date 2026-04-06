const { Pool } = require("pg");
require("dotenv").config();

let connectionString = String(process.env.DATABASE_URL || "").trim();
if (connectionString.startsWith("psql ")) {
  connectionString = connectionString.slice(5).trim();
}
if ((connectionString.startsWith("\"") && connectionString.endsWith("\"")) || (connectionString.startsWith("'") && connectionString.endsWith("'"))) {
  connectionString = connectionString.slice(1, -1);
}

const useSsl = !!connectionString && (connectionString.includes("sslmode=require") || connectionString.includes("neon.tech") || process.env.NODE_ENV === "production");

const pool = new Pool({
  connectionString,
  ssl: useSsl
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = { pool };