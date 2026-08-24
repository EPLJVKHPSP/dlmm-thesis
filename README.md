# DLMM Thesis Evidence

This repository contains the public, presentation-safe research artifacts for
the thesis **“Aspects of Security in Decentralized Finance: Design and
Evaluation of an Integrated Monitoring and Risk-Allocation System.”**

It is intentionally not a copy of the operational DLMM application. The
repository includes the methods, selected reference implementation modules,
and evidence needed to explain and verify the thesis evaluation:

1. a time-ordered historical depeg calibration using public market data;
2. pseudonymized out-of-fold protocol-risk scores and metric recomputation;
3. a synthetic, normalized constraint-checking demonstration; and
4. aggregate result files with the limitations reported alongside the metrics;
   and
5. safe reference modules for position-scoped depeg monitoring, transparent
   composite-risk scoring, and constrained allocation validation.

## Key results

| Evaluation | Design | Result |
|---|---|---|
| Historical depeg detection | Fit on 2022; test on untouched Jan–Jun 2023 observations | ROC-AUC 0.9729, precision 0.6667, recall 0.4000, F1 0.5000 |
| Protocol-risk calibration | Leave-one-protocol-out evaluation over 24 pseudonymized units | ROC-AUC 0.7053, average precision 0.3405; 95% bootstrap interval 0.4874–0.9074 |
| Tier comparison | Training-only BIC for depeg tiers; out-of-fold BIC for risk groups | Three depeg warning tiers and two protocol-risk groups were selected within the evaluated samples |
| Constraint verification | Sanitized summary plus a synthetic normalized fixture | All declared rule families pass with zero violations |

These results support a bounded decision-support claim. They do not establish
advance price prediction, autonomous trading performance, or realized returns.

## Reproduce the safe checks

Node.js 20 or later is sufficient; no package installation, database, wallet,
or credentials are required.

```bash
npm test
```

The historical depeg calibration can also be rerun against the public
DefiLlama Coins API:

```bash
npm run study:depeg
```

The historical rerun is network-dependent and may differ slightly if the
provider revises historical observations. The archived result records its
normalized-sample SHA-256 hash.

## Repository map

- `data/depeg-event-labels.json` — externally sourced, time-split event windows.
- `data/risk-oof-scores.json` — pseudonymized out-of-fold labels and scores.
- `scripts/historical-depeg-calibration.mjs` — public-market calibration.
- `scripts/risk-validation.mjs` — ROC-AUC, average-precision, and bootstrap recomputation.
- `scripts/constraint-demo.mjs` — synthetic normalized cap-checking example.
- `src/depeg-monitor.mjs` — position-scoped alert and recovery state machine.
- `src/composite-risk.mjs` — explicit weighted risk-score calculation.
- `src/constrained-allocation.mjs` — normalized allocation-rule validator.
- `tests/` — executable unit tests for the public reference modules.
- `results/` — archived, presentation-safe results.
- `docs/METHOD.md` — evaluation design and leakage controls.
- `docs/RESULTS.md` — interpretation and limitations.
- `docs/SYSTEM.md` — architecture, data flow, and security boundaries.
- `docs/TRACEABILITY.md` — research-question-to-evidence map.
- `docs/DEMO.md` — short presentation sequence.
- `PRIVACY.md` — explicit exclusions and disclosure boundary.

## Scope

This repository contains no production source tree, Git history from the
operational repository, secrets, user records, database snapshots, wallet
addresses, live positions, balances, monetary allocations, server details, or
deployment configuration.

The immutable thesis reference is release `v1.1.0`. A reader can select that
release in GitHub, inspect every included file, and run the checks locally with
`npm test`.

Author: **Alimbaev Arslan**
