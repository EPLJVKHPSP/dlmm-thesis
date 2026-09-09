# Evaluation method

## Historical depeg study

The detector uses four normalized signals: the current absolute peg deviation,
the 24-hour mean absolute deviation, 24-hour price volatility, and six-hour
downside momentum. Candidate weights and the alert threshold are chosen only
from the 2022 calibration period. Observations from January through June 2023
are kept separate and used once for final evaluation.

Four event windows are labelled from external sources before scoring. The
calibration events are the UST collapse and temporary USDT stress in May 2022.
The separate evaluation events are the USDC/SVB dislocation and related DAI
contagion in March 2023. Prices are requested from the public DefiLlama Coins
API at six-hour resolution.

The study asks whether observations inside a documented event window receive
higher risk scores. It measures contemporaneous detection, not whether the
method predicts a depeg before market prices move.

## Protocol-risk study

The outcome-derived incident component is excluded from the inputs because it
would reveal the label to the scoring method. Evaluation uses
leave-one-protocol-out cross-validation: each protocol is scored by parameters
selected without that protocol. Public records contain an arbitrary unit ID,
its binary label, and its out-of-fold score.

The validation script recomputes ROC-AUC, average precision, and a seeded
bootstrap interval. The test therefore shows ranking performance and its
uncertainty without publishing identifying operational records. Because exact
historical snapshots of every external rating were unavailable, this is an
out-of-protocol evaluation rather than a chronological one.

## Tier comparison

The depeg study compares three, four, and five warning tiers using binomial BIC
computed only on the calibration period. The protocol-risk study compares two,
three, and four monotonic risk groups using out-of-fold scores. These are
statistical comparisons for the evaluated samples; they do not automatically
change the application's governance rules.

## Constraint verification

The executable allocation scenario represents $9,000,000 deployed from a
$10,000,000 capital base across Aave V3, Kamino Lend, Lido, and Curve. The
smallest position is $100,000 and the largest is $5,000,000. A separate
$1,000,000 rebalance proposal shows how idle USDC is checked against the same
portfolio-wide capital base. The validator checks full proposal allocation,
minimum and maximum position size, pool-type caps, aggregate protocol
concentration, and tier budgets. Passing these deterministic checks does not
claim or guarantee an investment return.
