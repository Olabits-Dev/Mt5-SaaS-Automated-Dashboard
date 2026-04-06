const { Pool } = require("pg");
require("dotenv").config();

const useSsl = !!process.env.DATABASE_URL && (process.env.DATABASE_URL.includes("sslmode=require") || process.env.DATABASE_URL.includes("neon.tech") || process.env.NODE_ENV === "production");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = { pool };