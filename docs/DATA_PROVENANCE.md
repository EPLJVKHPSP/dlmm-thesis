# Data provenance

| Dataset | Origin | Transformation | Use |
|---|---|---|---|
| `data/depeg-event-labels.json` | Public event reporting and source URLs recorded in the file | Event windows fixed before model scoring | Defines calibration and held-out depeg episodes |
| Historical price observations | Public DefiLlama Coins API | Six-hour observations normalized into deviation, rolling mean, volatility, and momentum | Depeg calibration and separate-period evaluation |
| `data/risk-oof-scores.json` | Pseudonymized research panel | Only arbitrary unit ID, label, and score are published | Recompute out-of-protocol ranking metrics and uncertainty |
| `results/*.json` | Outputs of the documented evaluation scripts | Aggregate metrics and methodological metadata | Thesis tables, Evaluation page, and verification checks |
| `src/lib/reference-data.ts` | Written solely for this repository | Read-only treasury scenario using public protocol names and review-only values | Reproducible interface walkthrough |
| `db/001_thesis.sql` | Relational form of the same reference snapshot | Review seed rows; bcrypt password hash | Optional database-backed walkthrough |

The interface records are not empirical observations and are never included in
the reported model metrics. Conversely, the pseudonymized evaluation records
are used for metric recomputation but are not presented as real user accounts,
wallets, or positions.
