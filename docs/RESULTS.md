# Results and interpretation

## Historical depeg evaluation

The 2022 training set contains 10,565 usable observations. The untouched 2023
test set contains 5,040 observations. Training selected weights of 0.40 for
current deviation, 0.45 for the 24-hour mean deviation, 0.15 for 24-hour
volatility, and 0 for six-hour downside momentum, with an alert threshold of
0.95.

On the held-out period, ROC-AUC is 0.9729, precision is 0.6667, recall is
0.4000, and F1 is 0.5000. Both labelled test episodes are detected on the
six-hour grid, with mean latency of 13.52 hours. This is evidence of detection
within event windows, not advance prediction.

## Protocol-risk evaluation

The pseudonymized panel contains 24 units, including five incident-associated
units. Leave-one-protocol-out ROC-AUC is 0.7053 and average precision is 0.3405.
The 95% seeded bootstrap interval for ROC-AUC is 0.4874–0.9074 and includes
chance, so uncertainty remains substantial.

The fitted descriptive weights are 0.05 for the internal rating, 0.60 for
Hindenrank, and 0.35 for TokenInsight. The direct incident-derived feature is
excluded to avoid label leakage. Because exact historical rating snapshots are
unavailable, this evaluation is out-of-protocol rather than time-ordered.

## Constraint evidence

The sanitized archived summary records six proposed positions, full allocation,
all declared cap-rule families checked, zero violations, and a passing result.
The public executable example uses only synthetic normalized units. Neither
artifact supports a claim about realized investment returns.

## Main limitations

- Only four historical depeg event windows are labelled.
- Six-hour data can smooth short-lived exchange-specific extremes.
- The risk sample contains only five incident-associated units.
- The risk confidence interval includes chance.
- Current external ratings may postdate some incidents.
- Constraint checks concern proposal-time rules, not execution or realized return.
