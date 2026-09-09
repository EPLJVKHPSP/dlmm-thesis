# System reference

## Application architecture

The public DLMM companion is a full-stack application. Next.js renders the user
interface and handles authenticated routes. Data comes from an in-repository
reference snapshot by default or from the included
PostgreSQL schema when `DATABASE_URL` is configured. The decision modules do not
depend on the interface, so the same calculations are exercised directly by
the automated tests.

The application shell preserves DLMM's logo, navigation groups, responsive
sidebar, light and dark design tokens, card and table styling, and control
spacing. The reference records use real protocol names while the interface
remains recognizably the same system.

```text
Browser interface
       |
authenticated server routes
       |
data repository ---- PostgreSQL (optional)
       |
depeg, risk, and allocation modules
```

## Monitored-position flow

Monitoring starts from configured positions rather than scanning all
markets. A scheduled observation is normalized, checked against the position's
reference price and confidence requirement, compared with its previous state,
and classified as stable, opened, active, or recovered. Only a change of state
is eligible for notification. `src/depeg-monitor.mjs` implements this state
machine, while the **Depeg monitor** page gives readable examples.

## Risk flow

Position inputs are normalized to a zero-to-ten scale. The calculator returns
each weighted contribution, the composite score, and the corresponding tier.
When an optional input is absent, the method renormalizes the remaining positive
weights rather than silently treating missing evidence as a zero-risk value.

The internal score contains four layers: protocol data (45%), token data
(22.5%), chain data (22.5%), and pool TVL (10%). **Protocol data** combines
protocol age with the protocol's share of its chain's TVL in equal parts. It is
therefore maturity-and-scale evidence, not a claim that TVL proves safety.

The final score combines that internal result (55%) with Hindenrank (20%),
TokenInsight (15%), and the Rekt incident record (10%). The page displays the
inputs and configured weights for both stages.

## Allocation flow

A proposal is checked for complete allocation of the rebalancing slice,
minimum and maximum position size, pool-type limits, aggregate protocol concentration, and tier
budgets. The validator receives the total capital base separately from the
slice so a small proposal cannot bypass portfolio-wide limits. Failed checks
return named violations. Passing checks return an advisory plan only.

## Security boundaries

The reviewer login uses a signed, HTTP-only, SameSite cookie. PostgreSQL passwords
are stored as bcrypt hashes. A shared HTTPS deployment can enable the cookie's
`Secure` flag with `DLMM_SECURE_COOKIE=true`. The reviewer account provides
access to the read-only presentation paths; it is not an authorization
mechanism for real assets.

There is deliberately no wallet provider, private-key handling, transaction
builder, signer, broadcaster, or live notification service. The API exposes
only the fixed review-portfolio ID and rejects other identifiers. These
boundaries make the code safe to inspect while preserving the software paths
needed to explain the thesis.
