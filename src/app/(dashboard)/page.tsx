import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart, LendingHealthRuler, NavLineChart } from "@/components/charts";
import { loadAppModel } from "@/lib/data-repository";
import {
  activityExposure,
  exposureByActivity,
  lendingHealth,
  navHistory,
  portfolioComposition,
  protocolLendingHealth,
} from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function OverviewPage() {
  const model = await loadAppModel();
  const deployed = model.positions.reduce((sum, position) => sum + position.principalUsd, 0);

  return <>
    <PageHeader title="Dashboard" description="NAV, exposure and portfolio composition"/>

    <div className="grid metrics">
      <Metric label="Net asset value" value="$10,000,000" detail={model.dataMode === "postgres" ? "PostgreSQL snapshot" : "Review snapshot"} tone="accent"/>
      <Metric label="Capital deployed" value={usd(deployed)} detail="Four active positions" tone="good"/>
      <Metric label="Idle capital" value="$1,000,000" detail="Available for allocation"/>
      <Metric label="Borrow headroom" value="$3,000,000" detail="Before open-position limit" tone="warn"/>
    </div>

    <Card className="strategy-card">
      <SectionTitle title="Active strategies" detail="Current treasury book"/>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Strategy</th><th>Protocol</th><th>Activity</th><th className="align-right">Capital</th><th className="align-right">Expected APY</th><th className="align-right">Risk</th></tr></thead><tbody>
        {model.strategies.map((strategy) => {
          const position = model.positions.find((row) => row.strategyId === strategy.id);
          return <tr key={strategy.id}><td><strong>{strategy.asset}</strong><span className="subtle">{strategy.id}</span></td><td>{strategy.protocol}</td><td>{strategy.activity}</td><td className="align-right">{usd(position?.principalUsd ?? 0)}</td><td className="align-right">{strategy.apy.toFixed(2)}%</td><td className="align-right">{strategy.riskScore.toFixed(2)}/10</td></tr>;
        })}
      </tbody></table></div>
    </Card>

    <div className="spacer"/>
    <Card>
      <SectionTitle title="NAV over time" detail="Capital and deployed assets"/>
      <NavLineChart data={navHistory}/>
    </Card>

    <div className="spacer"/>
    <div className="grid two-col equal-cols dashboard-charts">
      <Card className="chart-card-wide"><SectionTitle title="Portfolio composition" detail="By holding"/><DonutChart data={portfolioComposition} size="large"/></Card>
      <Card className="chart-card-wide"><SectionTitle title="Exposure by activity" detail="$9.0m deployed · $1.0m idle"/><DonutChart data={activityExposure} size="large"/></Card>
    </div>

    <div className="spacer"/>
    <Card>
      <SectionTitle title="Lending health" detail="Fund-level borrow headroom · Lend $5,000,000"/>
      <LendingHealthRuler data={lendingHealth}/>
    </Card>

    <div className="spacer"/>
    <SectionTitle title="Protocol lending health" detail="Per-protocol limits"/>
    <div className="grid two-col equal-cols">
      {protocolLendingHealth.map((row) => <Card key={row.protocol}><SectionTitle title={row.protocol} detail={`Collateral ${usd(row.collateral)}`}/><LendingHealthRuler data={row} compact/></Card>)}
    </div>

    <div className="spacer"/>
    <div className="grid two-col equal-cols exposure-grid">
      <Card><SectionTitle title="Farming exposure" detail="Active, by platform"/><DonutChart data={exposureByActivity.farming}/></Card>
      <Card><SectionTitle title="Staking exposure" detail="Active, by platform"/><DonutChart data={exposureByActivity.staking}/></Card>
      <Card><SectionTitle title="Lending exposure" detail="By protocol"/><DonutChart data={exposureByActivity.lending}/></Card>
      <Card><SectionTitle title="Borrowing exposure" detail="Open positions by platform"/><DonutChart data={exposureByActivity.borrowing}/></Card>
    </div>
  </>;
}
