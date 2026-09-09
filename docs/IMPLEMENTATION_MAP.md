# Implementation map

Use this map to move from a visible feature to the exact code and check that
support it.

| Visible feature | Server or data path | Decision logic | Verification |
|---|---|---|---|
| Login and logout | `src/app/login/page.tsx`, `src/app/api/logout/route.ts`, `src/lib/session.ts` | Signed session, timing-safe local comparison, bcrypt database comparison | Manual login/logout and production build |
| Dashboard, NAV, and allocation charts | `src/app/(dashboard)/page.tsx`, `src/components/charts.tsx`, `src/lib/view-data.ts` | Portfolio aggregation, activity allocation, and lending-health presentation | Browser review and application build |
| Positions | `src/app/(dashboard)/positions/page.tsx`, `GET /api/portfolio/[walletId]` | Fixed review-portfolio scope | API and browser review |
| Lending, borrowing, staking, and farming | `src/app/(dashboard)/ops/*/page.tsx`, `src/components/position-workbench.tsx` | Activity-specific position fields and browser-side record creation | Browser review of all four forms and tables |
| Lending Health | `src/app/(dashboard)/rebalance/exposure/page.tsx`, `src/components/charts.tsx` | Fund and protocol limit-ruler presentation | Browser review |
| Strategies | `src/app/(dashboard)/strategies/page.tsx`, `src/lib/view-data.ts` | Pool filtering and strategy depth presentation | Browser review |
| Depeg Monitor | `src/app/(dashboard)/depeg/page.tsx` | `src/depeg-monitor.mjs` transition state machine | `tests/depeg-monitor.test.mjs` |
| Ratings | `src/app/(dashboard)/ratings/page.tsx`, `src/lib/view-data.ts` | Protocol list, search, chain filter, and tier filter; the calculation remains in `src/composite-risk.mjs` and `src/protocol-risk.mjs` | Browser review plus composite and protocol risk tests |
| Liquidity Optimization | `src/app/(dashboard)/rebalance/page.tsx`, `POST /api/rebalance` | `src/constrained-allocation.mjs` | Constraint tests and `scripts/allocation-check.mjs` |
| Notifications | `src/app/(dashboard)/notifications/page.tsx` | Transition records from the data repository | Browser review |
| MM Performance and Assessment Period | `src/app/(dashboard)/profit/page.tsx`, `src/app/(dashboard)/assessment-period/page.tsx` | NAV and period accounting presentation | Browser review |
| Evaluation | `src/app/(dashboard)/evaluation/page.tsx` | Published result readers | `scripts/verify-results.mjs` and `docs/RESULTS.md` |

The browser layer is organized as an operational interface. The `.mjs` modules
contain the calculations and the research documents explain their methodology,
so the calculations can be tested without a browser, database, or network
connection.
