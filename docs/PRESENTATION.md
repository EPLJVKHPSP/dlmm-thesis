# Presentation route

The operational tour takes approximately five minutes. The evaluation page is
separate, so it only needs to be shown if the examiner asks about the thesis
results.

1. Run `npm run dev`, open `http://localhost:3000`, and sign in with the
   documented reviewer account.
2. Start on **Dashboard**. Show the $10,000,000 NAV, the $9,000,000 deployed
   book, the $1,000,000 idle balance, the active-strategy table, the NAV chart,
   the portfolio donut, and the full **Exposure by activity** donut.
3. Open **Positions** to show the four operational areas. Then use **Lending**,
   **Borrowing**, **Staking**, or **Farming** in the Operations section. Each
   area has its own position table, exposure donut, summary, and Add position
   form.
4. Open **Lending Health**. Show the fund-level ruler followed by the Aave V3
   and Kamino Lend protocol rulers. These show borrowed value, available
   headroom, open-position limits, policy limits, and liquidation thresholds.
5. Open **Strategies**. The page lists real protocol and pool examples with
   their chain, tier, APY, decision APY, TVL, and operational state.
6. Open **Ratings**. Present it as the production-style protocol list: protocol,
   chain, score, risk tier, policy tier, source, and update date. The scoring
   methodology belongs in the paper, not in this operational screen.
7. Open **Liquidity Optimization** and then **Depeg Monitor** if you want to
   show the decision and monitoring workflows.
8. Only if asked about the empirical study, open **Thesis → Evaluation**. It
   keeps the depeg and risk-study checks separate from the operational UI.
9. If implementation detail is requested, open `docs/IMPLEMENTATION_MAP.md`,
   then show the relevant interface page, route, decision module, and test.

## Useful review commands

```bash
npm run check
curl http://localhost:3000/api/health
```

After signing in through the browser, the two review endpoints are:

- `GET /api/portfolio/TREASURY-USDC`
- `POST /api/rebalance`

Do not substitute real addresses or financial records during the presentation.
The bundled review records exercise every implemented path.
