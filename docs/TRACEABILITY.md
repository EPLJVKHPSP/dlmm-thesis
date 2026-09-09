# Research traceability

| Thesis question | Implementation or method | Evidence available to the reviewer |
|---|---|---|
| RQ1: How can monitoring, risk assessment, notifications, and allocation support be integrated? | `src/app/`, authenticated routes, `src/lib/data-repository.ts`, and `docs/SYSTEM.md` | Working Dashboard, Positions, activity-specific operations pages, Lending Health, Strategies, Notifications, and Evaluation pages; application build |
| RQ2: How effectively does the depeg method identify documented instability? | `src/depeg-monitor.mjs` and `scripts/historical-depeg-calibration.mjs` | Event labels, held-out result file, state-machine tests, and Depeg monitor page |
| RQ3: How can position and protocol risk be expressed transparently? | `src/composite-risk.mjs`, `src/protocol-risk.mjs`, and Ratings page | Per-component contributions, tests, pseudonymized out-of-fold scores, calibration and sensitivity summaries |
| RQ4: How can an allocation proposal be kept within explicit limits? | `src/constrained-allocation.mjs` and `/api/rebalance` | Interactive $1,000,000 proposal, a $9,000,000 portfolio scenario, $100,000–$5,000,000 position bounds, and automated constraint tests |
| RQ5: Which controls reduce security and privacy exposure in the integrated design? | Signed session, fixed-ID API, optional parameterized database access, and absence of transaction capabilities | Login/logout flow, health response reporting `transactionsEnabled: false`, source inspection, tests, and `PRIVACY.md` |

The mapping connects every claim to something the examiner can run, inspect, or
recompute. Quantitative claims retain the limitations stated in
`docs/RESULTS.md`.
