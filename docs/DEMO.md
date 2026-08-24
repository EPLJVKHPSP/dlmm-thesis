# Three-minute presentation path

1. Start on the repository `README.md`. State that this is a clean research
   artifact, not the operational application.
2. Open `data/depeg-event-labels.json` and point out the fixed train/test split
   and externally sourced event windows.
3. Open `scripts/historical-depeg-calibration.mjs` and show the feature
   construction, training-only grid search, held-out evaluation, and BIC tier
   comparison.
4. Open `results/historical-depeg-calibration.json` and show only
   `design`, `sample`, `calibratedModel.testMetrics`, and `limitations`.
5. Run `npm test`. The output recomputes the pseudonymized risk metrics, checks
   the archived aggregate evidence, and runs the synthetic constraint fixture.
6. End with `docs/RESULTS.md`, emphasizing the confidence interval and the
   distinction between contemporaneous detection and prediction.

Do not open server consoles, environment files, private repositories, database
tools, wallet explorers, operational dashboards, or deployment records during
the presentation.
