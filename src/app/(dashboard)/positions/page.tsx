import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { loadAppModel } from "@/lib/data-repository";
import Link from "next/link";

export default async function PositionsPage() {
  const model = await loadAppModel();
  const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return <>
    <PageHeader title="Positions" description="Active staking, farming, lending, and borrowing records"/>
    <div className="activity-launcher">
      {[{name:"Staking",href:"/ops/staking",value:"$1,900,000"},{name:"Farming",href:"/ops/farming",value:"$100,000"},{name:"Lending",href:"/ops/lending",value:"$5,000,000"},{name:"Borrowing",href:"/ops/borrowing",value:"$2,000,000"}].map((item)=><Link href={item.href} key={item.name} className="activity-card"><span>{item.name}</span><strong>{item.value}</strong><small>Open positions →</small></Link>)}
    </div>
    <div className="spacer"/>
    <Card>
      <SectionTitle title="Position ledger" detail="Aave V3, Kamino Lend, Lido, and Curve"/>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID / strategy</th><th>Type</th><th>Protocol</th><th>Asset</th><th>Principal</th><th>Collateral link</th><th>Gauge / period</th></tr></thead>
          <tbody>{model.positions.map((position) => <tr key={position.id}>
            <td><strong>{position.id}</strong><span className="subtle">{position.strategyId}</span></td>
            <td><Badge tone="info">{position.kind}</Badge></td>
            <td>{position.protocol}</td>
            <td>{position.asset}</td>
            <td>{usd(position.principalUsd)}</td>
            <td>{position.collateralFor || "—"}</td>
            <td><strong>{position.poolGauge}</strong><span className="subtle">{position.assessmentPeriod}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </>;
}
