# DLMM Thesis Companion

This repository contains the reviewer-facing companion application for the
thesis *A DeFi Decision Support System for Risk Monitoring and Capital
Allocation Across Liquidity Pools*.

The application provides a reproducible demonstration of position monitoring,
lending health, depeg monitoring, protocol ratings, strategy research,
performance reporting, activity-specific position records, and constrained
rebalancing. The thesis is the authoritative source for the research
methodology, equations, empirical design, results, and limitations. This README
only explains how to install, run, inspect, and verify the repository.

## Requirements

- Node.js 20 or later
- npm
- Internet access for installation and optional live DefiLlama checks
- Docker only when using the PostgreSQL-backed configuration
- A reviewer-created Telegram bot only when testing Telegram delivery

## Start the application

From the repository root:

```bash
npm ci
cp .env.example .env
# Set your local values in .env before starting.
npm run dev
```

Create an untracked `.env` from `.env.example`, set a unique
`DLMM_REVIEW_PASSWORD` and a random `DLMM_SESSION_KEY`, then open
`http://localhost:3000` and sign in as `reviewer@dlmm.local` with the
password you configured. Review login remains disabled until configured.
See [SECURITY_CREDENTIALS.md](SECURITY_CREDENTIALS.md) for Docker/PostgreSQL
credential setup and existing database migration.

The application uses its bundled review snapshot by default, so PostgreSQL is
not required for the normal walkthrough.

## Application walkthrough

The review scenario represents a fictional $10,000,000 treasury: $9,000,000
deployed across Aave V3, Kamino Lend, Lido, and Curve, plus $1,000,000 idle
USDC. It contains no real wallet, holding, account, or transaction record.

The main screens are:

- **Dashboard**: NAV, deployed and idle capital, strategy table, performance
  history, activity exposure, portfolio composition, and lending health.
- **Positions**: the complete lending, borrowing, staking, and farming ledger.
- **MM Performance** and **Assessment Period**: expected income, borrowing
  costs, NAV history, and assessment-period records.
- **Select**, **Idle Assets**, **Liquidity Optimization**, **Preview**, and
  **Execute**: a guided advisory rebalance flow. It never signs or submits a
  transaction.
- **Lending Health**: fund-level and per-protocol borrowing limits and
  liquidation thresholds.
- **Depeg Monitor**: the current held-asset monitoring scope for USDC, DAI, and
  stETH.
- **Strategies** and **Ratings**: filterable opportunity and protocol views.
- **Staking**, **Farming**, **Lending**, and **Borrowing**: activity-specific
  tables and position-entry forms. New entries remain in the browser session.

## Replay historical real events

The recommended reviewer demonstration uses the frozen DefiLlama observations
included in the repository:

```bash
npm run episodes:depeg -- --offline
```

This command does not require the application server, PostgreSQL, Telegram
credentials, or internet access. It replays the application monitor's shared
depeg classifier over the selected UST, USDC, and DAI event observations and
checks the output against the published evidence.

Expected result:

```text
PASS UST ust-collapse-2022 - opened ...; no recovery
PASS USDC usdc-svb-2023 - opened ...; recovered ...
PASS DAI dai-usdc-contagion-2023 - opened ...; recovered ...
DONE exact monitor replay - 3/3 expected outcomes passed
```

To request the event observations from DefiLlama again instead of using the
frozen snapshot:

```bash
npm run episodes:depeg
```

The online command requires internet access and may take longer. The historical
replay tests the monitor's decision behavior; it does not send Telegram
messages and does not claim advance prediction. Full methodology and
interpretation are documented in the thesis.

## Configure Telegram notifications

Telegram support is optional. Without credentials, the monitor remains dormant
and the rest of the application continues to work.

Create a reviewer-owned bot:

1. Message `@BotFather` in Telegram and run `/newbot`.
2. Copy the bot token.
3. Open the new bot and press **Start**.
4. Obtain the reviewer's chat ID, for example from `@userinfobot`.
5. Set `BOT_TOKEN` and `TELEGRAM_CHAT_IDS` in your untracked `.env`. The web
   application and the standalone Telegram scripts load it automatically.
   Process environment variables take precedence; keep credentials out of Git.

Test the three documented example messages:

```bash
npm run alert:examples
```

The reviewer should receive, in order:

1. A connection test.
2. A USDC depeg-opened example.
3. A USDC recovery example.

There should be no fourth message because continuing active observations are
silent.

Run one live held-asset check:

```bash
npm run monitor:telegram:once
```

Run continuous monitoring:

```bash
npm run monitor:telegram
```

The worker checks only held, non-demo assets. USDC and DAI are compared with
USD, while stETH is compared with ETH. It sends only depeg-opened and recovery
transitions. It does not send strategy-optimization or rebalance messages.

The default polling interval is 60 seconds. It can be changed with
`TELEGRAM_POLL_SECONDS`, with a minimum of 15 seconds. When PostgreSQL is
configured, the last monitoring state survives worker restarts.

## Run with Docker and PostgreSQL

Set `DLMM_DB_PASSWORD` to a password for your own local database and
`DLMM_DATABASE_URL` to the matching PostgreSQL connection URI in `.env`.
Use `postgres` as the database host inside Compose and URL-encode special
characters in the password. See [SECURITY_CREDENTIALS.md](SECURITY_CREDENTIALS.md)
for the URI format and migration of existing database volumes.

```bash
docker compose up --build
```

Open `http://localhost:3000` and use the same reviewer credentials. Docker
starts PostgreSQL, the application, and the Telegram worker. The worker remains
dormant unless `BOT_TOKEN` and `TELEGRAM_CHAT_IDS` are provided in the
environment.

## Verification commands

```bash
npm test
npm run check
npm run reproduce
```

- `npm test` runs the unit tests, published-evidence checks, risk validation,
  allocation checks, and the offline real-event replay.
- `npm run check` runs the complete test set and creates a production build.
- `npm run reproduce` recomputes the offline evidence without a separate manual
  build step.

Additional commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local interface with development reloads |
| `npm run build` | Create the standalone production build |
| `npm start` | Start the previously built standalone application |
| `npm run episodes:depeg -- --offline` | Replay the three frozen real-event series |
| `npm run episodes:depeg` | Fetch and replay the selected event windows from DefiLlama |
| `npm run study:depeg` | Rerun the supplementary historical analysis using live DefiLlama data |
| `npm run alert:test` | Send one Telegram connectivity message |
| `npm run alert:examples` | Send the connection, opened, and recovered examples |
| `npm run monitor:telegram:once` | Perform one held-asset monitoring check |
| `npm run monitor:telegram` | Start continuous held-asset monitoring |

## API routes

All routes except `/api/health` require the reviewer session.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Report liveness, data source, and disabled transaction state |
| `GET` | `/api/portfolio/TREASURY-USDC` | Return the fictional review treasury and four positions |
| `GET` | `/api/portfolio/DEMO-USDC` | Return the isolated $5 demonstration wallet |
| `POST` | `/api/rebalance` | Validate the fixed advisory proposal without submitting a transaction |
| `POST` | `/api/telegram/test` | Send a Telegram connectivity test when configured |
| `POST` | `/api/logout` | End the reviewer session |

Unknown portfolio identifiers return `404`; the application does not provide
arbitrary wallet lookup.

## Repository structure

| Path | Contents |
|---|---|
| `src/app` | Next.js pages and authenticated API routes |
| `src/components` | Application shell, charts, forms, and workflow components |
| `src/lib` | Data access, monitoring, Telegram, and rebalance support |
| `src/*.mjs` | Reusable depeg, risk, and allocation calculations |
| `scripts` | Reproduction, validation, monitoring, and delivery commands |
| `tests` | Deterministic unit tests |
| `data` | Public event inputs, frozen prices, and review data |
| `results` | Machine-readable evaluation outputs |
| `db` | Optional PostgreSQL schema and fictional seed records |
| `public` | Static interface assets |

## Security and disclosure boundary

The repository contains public protocol names, public historical observations,
fictional interface records, pseudonymized evaluation rows, calculation code,
and aggregate result files. It does not contain private keys, seed phrases,
real wallet addresses, real positions, Telegram tokens, subscriber lists,
cookies, production databases, or transaction hashes.

The application cannot connect a wallet, construct a transaction, sign it, or
broadcast it. Rebalance output is advisory and requires external human action.
The only optional live outbound operation is Telegram notification delivery
using credentials supplied by the reviewer.

## Troubleshooting

- **Port 3000 is already in use:** use the alternate URL printed by Next.js or
  stop the other local server.
- **Telegram is silent:** confirm that the reviewer pressed Start in the bot,
  then check the chat ID and environment variables.
- **The Telegram sender reports dormant:** set both `BOT_TOKEN` and
  `TELEGRAM_CHAT_IDS` in `.env`, then restart the command.
- **The online historical replay is slow:** use
  `npm run episodes:depeg -- --offline` for the reproducible reviewer run.
- **Dashboard totals differ in database mode:** confirm that the review seed was
  loaded. The `DEMO-USDC` wallet is excluded from treasury totals.

Author: **Alimbaev Arslan**
