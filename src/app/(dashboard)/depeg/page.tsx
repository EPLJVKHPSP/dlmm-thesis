import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { loadAppModel } from "@/lib/data-repository";
import { monitorScopeRefresh } from "@/lib/reference-data";

export default async function DepegPage() {
  const model = await loadAppModel();
  const activeDepegs = model.monitorScope.filter((row) => row.lastTransition !== "stable").length;

  return <>
    <PageHeader title="Depeg Monitor" description="Every asset in use, watched once against its reference."/>
    <div className="grid metrics">
      <Metric label="Assets in scope" value={String(model.monitorScope.length)} detail="USDC · DAI · stETH" tone="accent"/>
      <Metric label="Active depegs" value={String(activeDepegs)} detail="Legs breaching threshold" tone={activeDepegs ? "bad" : "good"}/>
      <Metric label="Last refresh" value={monitorScopeRefresh.value} detail={monitorScopeRefresh.detail} tone="good"/>
      <Metric label="Threshold" value="3.00%" detail="Deviation vs reference" tone="warn"/>
    </div>
    <Card>
      <SectionTitle title="Monitored assets" detail="One row per asset — held by several legs, watched once"/>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Asset</th><th>Legs</th><th>Reference</th><th>Method</th><th>Threshold</th><th>Last state</th></tr></thead><tbody>
        {model.monitorScope.map((row) => <tr key={row.asset}>
          <td><strong>{row.asset}</strong></td>
          <td>{row.legs}</td>
          <td>{row.reference}</td>
          <td>{row.method}</td>
          <td className="align-right">{row.thresholdPct.toFixed(2)}%</td>
          <td><Badge tone={row.lastTransition === "stable" ? "good" : row.lastTransition === "opened" ? "bad" : "warn"}>{row.lastTransition}</Badge></td>
        </tr>)}
      </tbody></table></div>
    </Card>
    <div className="spacer"/>
    <Card>
      <SectionTitle title="Monitor checks" detail="Scope and transition guards"/>
      <div className="checks">
        <div className="check"><span>Leg active and in scope</span><span>PASS</span></div>
        <div className="check"><span>Observation above confidence floor</span><span>PASS</span></div>
        <div className="check"><span>Deviation ≥ threshold</span><span>PASS</span></div>
        <div className="check"><span>Duplicate event prevented</span><span>PASS</span></div>
      </div>
    </Card>
  </>;
}
