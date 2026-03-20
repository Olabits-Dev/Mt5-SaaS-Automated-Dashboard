CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mt5_login TEXT,
  mt5_server TEXT,
  expiry_date DATE,
  active BOOLEAN DEFAULT TRUE,
  dd_limit_pct NUMERIC(10,2) DEFAULT 5.00,
  allowed_pairs_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_status (
  id SERIAL PRIMARY KEY,
  heartbeat_at TIMESTAMP DEFAULT NOW(),
  source_machine TEXT,
  status TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  volume NUMERIC(18,6),
  entry_price NUMERIC(18,8),
  sl NUMERIC(18,8),
  tp NUMERIC(18,8),
  pnl NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'OPEN',
  ticket TEXT,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'ACTIVE',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
); 