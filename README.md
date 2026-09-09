# DLMM — Thesis Companion

This repository is the reviewable companion application for the thesis
**“Aspects of Security in Decentralized Finance: Design and Evaluation of an
Integrated Monitoring and Risk-Allocation System.”** It combines the working
DLMM interface, authenticated server routes, a relational review schema, the core decision
logic, automated tests, and the quantitative evaluation artifacts discussed in
the paper.

The interface uses DLMM's own logo, navigation grouping, light and dark design
tokens, spacing, cards, tables, badges, and responsive shell from the supplied
application project.

The application presents a $10,000,000 treasury scenario across Aave V3, Kamino
Lend, Lido, and Curve. Recorded positions range from $100,000 to $5,000,000.
The public repository contains no real account, wallet address, holding, or
transaction record and cannot connect a wallet, sign a transaction, or move funds.

## Run the application

Node.js 20 or later is required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use:

- Login: `reviewer@dlmm.local`
- Password: `review-access`

The application starts with its bundled reference snapshot. PostgreSQL is
optional, so the presentation does not depend on a database service.

For the database-backed version:

```bash
docker compose up --build
```

The same URL and credentials apply. The container initializes PostgreSQL with
the same review records from `db/001_thesis.sql`.

## What can be presented

- an authenticated, production-style dashboard with NAV, strategy, portfolio,
  and activity-allocation charts;
- dedicated lending, borrowing, staking, and farming pages with position tables
  and creation forms;
- fund-level and protocol-level lending-health rulers;
- strategy and protocol-rating lists using real protocol names;
- a constrained rebalancing proposal and depeg-monitor workflow; and
- a separate Evaluation page for the empirical depeg, risk-calibration, and
  constraint results discussed in the thesis.

The recommended presentation route is in `docs/PRESENTATION.md`.

## Verify the implementation and evidence

```bash
npm run check
```

This runs the decision-logic tests, recomputes the published evidence checks,
validates the risk metrics and allocation constraints, and creates a production
build of the application.

For a shorter offline recomputation of the published checks without rebuilding
the interface, run `npm run reproduce`.

The historical depeg study can also be rerun against the public DefiLlama Coins
API:

```bash
npm run study:depeg
```

That rerun requires internet access and can change slightly if the data provider
revises historical observations. The published result includes the normalized
sample's SHA-256 hash.

## Key empirical results

| Evaluation | Design | Result |
|---|---|---|
| Historical depeg detection | Calibrated on 2022; evaluated on untouched January–June 2023 observations | ROC-AUC 0.9729, precision 0.6667, recall 0.4000, F1 0.5000 |
| Protocol-risk calibration | Leave-one-protocol-out evaluation over 24 pseudonymized units | ROC-AUC 0.7053, average precision 0.3405; 95% bootstrap interval 0.4874–0.9074 |
| Tier comparison | Calibration-period BIC for depeg tiers; out-of-fold BIC for risk groups | Three depeg warning tiers and two protocol-risk groups were selected within the evaluated samples |
| Constraint verification | Published summary plus a $9,000,000 allocation scenario against a $10,000,000 capital base | All declared rule families pass with zero violations; position bounds are $100,000–$5,000,000 |

The results support a bounded decision-support claim. They do not establish
advance price prediction, autonomous trading performance, or realized returns.

## Repository map

- `src/app/` — interface pages and authenticated JSON routes.
- `src/components/` — shared navigation, cards, tables, and review controls.
- `src/lib/` — reference records, optional PostgreSQL access, and signed sessions.
- `src/depeg-monitor.mjs` — position-scoped alert and recovery state machine.
- `src/composite-risk.mjs` and `src/protocol-risk.mjs` — transparent scoring.
- `src/constrained-allocation.mjs` — deterministic allocation-rule validator.
- `db/001_thesis.sql` — relational schema and review seed records.
- `tests/` — executable tests for the decision modules.
- `data/`, `scripts/`, and `results/` — empirical datasets, evaluation code, and outputs.
- `docs/IMPLEMENTATION_MAP.md` — interface-to-code map.
- `docs/DATA_PROVENANCE.md` — source and transformation boundaries.
- `docs/METHOD.md` and `docs/RESULTS.md` — evaluation method and interpretation.
- `docs/SYSTEM.md` — architecture and security boundaries.
- `docs/TRACEABILITY.md` — research-question-to-evidence map.
- `PRIVACY.md` — exact public-disclosure boundary.

Author: **Alimbaev Arslan**
