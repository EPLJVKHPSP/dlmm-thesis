# Public system reference

## Monitored-position flow

The operational design begins with configured positions rather than scanning
every market indiscriminately. A scheduled observation is normalized, checked
against the position's reference price and confidence requirement, compared
with its persisted state, and classified as stable, opened, active, or
recovered. Only a state transition is eligible to produce a notification. The
standalone state machine in `src/depeg-monitor.mjs` exposes this behavior.

## Risk and allocation flow

Risk inputs are normalized to a common zero-to-ten scale. The public calculator
returns the weighted contribution of every available component, the normalized
composite score, and the corresponding tier. Missing optional values are not
silently treated as zero; the remaining positive weights are renormalized.

Allocation remains advisory. A proposed normalized budget is checked for full
allocation, minimum size, pool-type caps, aggregate protocol concentration,
and tier budgets. Failed checks return explicit violations. The public package
does not sign or broadcast transactions.

## Security boundaries

The public modules contain deterministic decision logic only. Authentication,
authorization, database access, notification credentials, wallet interaction,
transaction signing, deployment configuration, and operational records are
outside this repository. This separation permits inspection of the evaluated
logic without publishing material that could expose users or operational
systems.
