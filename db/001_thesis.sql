-- DLMM thesis companion schema. Contains no wallet addresses or transaction capability.

CREATE TABLE IF NOT EXISTS app_user (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('reviewer', 'operator')),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS wallet (
  id text PRIMARY KEY,
  label text NOT NULL,
  asset text NOT NULL,
  balance_usd numeric(18, 2) NOT NULL CHECK (balance_usd >= 0)
);

CREATE TABLE IF NOT EXISTS strategy (
  id text PRIMARY KEY,
  source text NOT NULL,
  protocol text NOT NULL,
  activity text NOT NULL,
  asset text NOT NULL,
  displayed_apy numeric(8, 4) NOT NULL,
  risk_score numeric(5, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_position (
  id text PRIMARY KEY,
  wallet_id text NOT NULL REFERENCES wallet(id),
  strategy_id text NOT NULL REFERENCES strategy(id),
  kind text NOT NULL,
  asset text NOT NULL,
  protocol text NOT NULL,
  principal_usd numeric(18, 2) NOT NULL,
  status text NOT NULL,
  collateral_for text,
  pool_gauge text,
  assessment_period text NOT NULL
);

CREATE TABLE IF NOT EXISTS notification (
  id text PRIMARY KEY,
  kind text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS depeg_monitor_state (
  asset text PRIMARY KEY,
  active boolean NOT NULL DEFAULT false,
  transition text NOT NULL,
  observed_price numeric(24, 10) NOT NULL,
  reference_price numeric(24, 10) NOT NULL,
  deviation_pct numeric(12, 6) NOT NULL,
  confidence numeric(8, 6) NOT NULL,
  observed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO wallet (id, label, asset, balance_usd) VALUES
  ('TREASURY-USDC', 'USDC Treasury', 'USDC', 1000000.00),
  ('DEMO-USDC', 'Demo wallet', 'USDC', 5.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO strategy (id, source, protocol, activity, asset, displayed_apy, risk_score) VALUES
  ('STR-AAVE-LEND', 'DefiLlama', 'Aave V3', 'Lending', 'USDC', 4.2000, 7.15),
  ('STR-KAMINO-BORROW', 'Protocol position', 'Kamino Lend', 'Borrowing', 'USDC', 5.1000, 6.80),
  ('STR-LIDO-STAKE', 'Protocol position', 'Lido', 'Staking', 'stETH', 3.2000, 7.40),
  ('STR-CURVE-FARM', 'DefiLlama', 'Curve', 'Farming', 'DAI / USDC', 4.8000, 6.20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO portfolio_position (
  id, wallet_id, strategy_id, kind, asset, protocol, principal_usd, status,
  collateral_for, pool_gauge, assessment_period
) VALUES
  ('POS-001', 'TREASURY-USDC', 'STR-AAVE-LEND', 'Lending', 'USDC', 'Aave V3', 5000000.00, 'Alert', NULL, 'AAVE-V3-USDC', '2026-Q3'),
  ('POS-002', 'TREASURY-USDC', 'STR-KAMINO-BORROW', 'Borrowing', 'USDC', 'Kamino Lend', 2000000.00, 'Active', NULL, 'KAMINO-USDC', '2026-Q3'),
  ('POS-003', 'TREASURY-USDC', 'STR-LIDO-STAKE', 'Staking', 'stETH', 'Lido', 1900000.00, 'Active', 'POS-002', 'LIDO-STETH', '2026-Q3'),
  ('POS-004', 'TREASURY-USDC', 'STR-CURVE-FARM', 'Farming', 'DAI / USDC', 'Curve', 100000.00, 'Active', NULL, 'CURVE-DAI-USDC', '2026-Q3'),
  ('DEMO-POS-001', 'DEMO-USDC', 'STR-AAVE-LEND', 'Lending', 'USDC', 'Aave V3', 5.00, 'Demo', NULL, 'AAVE-V3-USDC', '2026-Q3')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification (id, kind, title, message, status, created_at) VALUES
  ('NOTICE-001', 'depeg', 'DEPEG ALERT', 'POS-001 · Aave V3 USDC lending · price $0.9620 · deviation 3.80%', 'Opened', '2023-03-11T13:00:00Z')
ON CONFLICT (id) DO NOTHING;
