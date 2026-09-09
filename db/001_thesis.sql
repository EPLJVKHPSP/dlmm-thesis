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

CREATE TABLE IF NOT EXISTS depeg_sample (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  position_id text NOT NULL REFERENCES portfolio_position(id),
  observed_at timestamptz NOT NULL,
  price numeric(12, 6) NOT NULL,
  reference_price numeric(12, 6) NOT NULL,
  transition text NOT NULL,
  source text NOT NULL
);

CREATE TABLE IF NOT EXISTS notification (
  id text PRIMARY KEY,
  kind text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

INSERT INTO app_user (id, email, password_hash, display_name, role)
VALUES (
  'REVIEWER-01',
  'reviewer@dlmm.local',
  '$2b$12$3E/X1xjR120ieDIi4QjW2uv0GG.HGM4hNcsMSk7i4lpjlQLGLWu4W',
  'Thesis Reviewer',
  'reviewer'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallet (id, label, asset, balance_usd) VALUES
  ('TREASURY-USDC', 'USDC Treasury', 'USDC', 1000000.00)
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
  ('POS-004', 'TREASURY-USDC', 'STR-CURVE-FARM', 'Farming', 'DAI / USDC', 'Curve', 100000.00, 'Active', NULL, 'CURVE-DAI-USDC', '2026-Q3')
ON CONFLICT (id) DO NOTHING;

INSERT INTO depeg_sample (position_id, observed_at, price, reference_price, transition, source) VALUES
  ('POS-001', '2023-03-11T07:00:00Z', 0.998000, 1.000000, 'stable', 'DefiLlama historical study'),
  ('POS-001', '2023-03-11T13:00:00Z', 0.962000, 1.000000, 'opened', 'DefiLlama historical study'),
  ('POS-001', '2023-03-11T19:00:00Z', 0.954000, 1.000000, 'active', 'DefiLlama historical study');

INSERT INTO notification (id, kind, title, message, status, created_at) VALUES
  ('NOTICE-001', 'depeg', 'DEPEG ALERT', 'POS-001 · Aave V3 USDC lending · price $0.9620 · deviation 3.80%', 'Opened', '2023-03-11T13:00:00Z'),
  ('NOTICE-002', 'rebalance', 'REBALANCE READY', '$1,000,000 USDC · Aave V3 lending · APY 4.20% · risk 7.15/10', 'Review required', '2023-03-11T19:05:00Z')
ON CONFLICT (id) DO NOTHING;
