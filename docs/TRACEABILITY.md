# Research traceability

| Thesis question | Public implementation or method | Public evidence |
|---|---|---|
| RQ1: secure integrated architecture | `docs/SYSTEM.md`; `src/depeg-monitor.mjs`; `src/composite-risk.mjs`; `src/constrained-allocation.mjs` | Unit tests in `tests/`; aggregate engineering summary |
| RQ2: monitoring effectiveness | Historical method and `scripts/historical-depeg-calibration.mjs` | Event labels and `results/historical-depeg-calibration.json` |
| RQ3: reproducibility and operational correctness | `scripts/verify-results.mjs`; deterministic unit tests | `npm test`; `results/engineering-validation-summary.json` |
| RQ4: defensible risk weights and tiers | Leakage-controlled method and `scripts/risk-validation.mjs` | Pseudonymized scores, calibration summary, and sensitivity summary |
| RQ5: allocation-rule enforcement | `src/constrained-allocation.mjs`; synthetic fixture | Constraint summary and executable tests |

The mapping is intentionally limited to claims made in the thesis. Operational
configuration and records are excluded under `PRIVACY.md`, and quantitative
claims retain the limitations stated in `docs/RESULTS.md`.
