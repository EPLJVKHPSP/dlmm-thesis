# Evaluation method

## Historical depeg study

The detector uses four normalized features: current absolute peg deviation,
24-hour mean absolute deviation, 24-hour price volatility, and six-hour
downside momentum. Candidate weights and the alert threshold are selected only
from the 2022 training period. The January–June 2023 period remains untouched
until final evaluation.

Four event windows are labelled from external sources before scoring. The
training events are the UST collapse and temporary USDT stress in May 2022. The
held-out events are the USDC/SVB dislocation and the related DAI contagion in
March 2023. Price observations are requested from the public DefiLlama Coins
API at six-hour resolution.

The design measures contemporaneous detection: whether market observations
inside a documented event window receive higher risk scores. It does not claim
that the detector predicts an event before prices move.

## Protocol-risk study

The risk evaluation excludes the incident-derived component from its feature
set because using it would leak the outcome into the predictor. Calibration is
evaluated with leave-one-protocol-out cross-validation. Each public record in
this repository contains only an arbitrary unit identifier, its binary label,
and its out-of-fold score.

The published validation script recomputes ROC-AUC, average precision, and a
seeded bootstrap confidence interval. Raw ratings, protocol identities, losses,
and operational records are not distributed.

## Tier comparison

The depeg study compares three, four, and five warning tiers using training-only
binomial BIC. The protocol-risk study compares two, three, and four monotonic
risk groups using out-of-fold scores. These statistical groups are distinct
from application governance tiers; a selected statistical model does not
automatically modify operational policy.

## Constraint demonstration

The constraint script uses fictitious candidates and a budget of 100 normalized
units. It checks minimum allocation, per-protocol concentration, tier budgets,
and pool caps. The fixture demonstrates deterministic rule enforcement only; it
contains no live positions, capital, prices, or return claims.
