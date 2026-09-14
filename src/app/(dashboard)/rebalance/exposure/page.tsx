import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart, LendingHealthRuler } from "@/components/charts";
import { exposureByActivity, lendingHealth, protocolLendingHealth } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function LendingHealthPage() {
  return <>
    <PageHeader title="Exposure" description="Active position exposure, borrow headroom, protocol limits, and collateral"/>
    <Card><SectionTitle title="Lending health" detail="Fund-level borrow headroom · Lend $5,000,000"/><LendingHealthRuler data={lendingHealth}/></Card>
    <div className="spacer"/>
    <div className="grid two-col equal-cols exposure-grid">
      <Card><SectionTitle title="Farming exposure" detail="Active, by platform"/><DonutChart data={exposureByActivity.farming}/></Card>
      <Card><SectionTitle title="Staking exposure" detail="Active, by platform"/><DonutChart data={exposureByActivity.staking}/></Card>
      <Card><SectionTitle title="Lending exposure" detail="By protocol"/><DonutChart data={exposureByActivity.lending}/></Card>
      <Card><SectionTitle title="Borrowing exposure" detail="Open positions by platform"/><DonutChart data={exposureByActivity.borrowing}/></Card>
    </div>
    <div className="spacer"/>
    <SectionTitle title="Protocol lending health" detail="Per-protocol lending limits"/>
    <div className="grid two-col equal-cols">{protocolLendingHealth.map((row) => <Card key={row.protocol}><SectionTitle title={row.protocol} detail={`Collateral ${usd(row.collateral)}`}/><LendingHealthRuler data={row} compact/></Card>)}</div>
    <div className="spacer"/>
    <Card><SectionTitle title="Lending positions" detail="Supplied collateral by protocol and asset"/><div className="table-wrap"><table className="data-table"><thead><tr><th>Protocol</th><th>Asset</th><th className="align-right">Supplied</th><th className="align-right">Borrowed</th><th className="align-right">Open-position limit</th><th className="align-right">Policy limit</th><th className="align-right">Liquidation</th></tr></thead><tbody>{protocolLendingHealth.map((row) => <tr key={row.protocol}><td><strong>{row.protocol}</strong></td><td>{row.protocol === "Aave V3" ? "USDC" : "mSOL / USDC"}</td><td className="align-right">{usd(row.collateral)}</td><td className="align-right">{usd(row.borrowed)}</td><td className="align-right">{usd(row.openPositionLimit)}</td><td className="align-right">{usd(row.policyLimit)}</td><td className="align-right">{usd(row.liquidationThreshold)}</td></tr>)}</tbody></table></div></Card>
  </>;
}
