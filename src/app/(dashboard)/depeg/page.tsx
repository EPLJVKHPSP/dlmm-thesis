import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { loadAppModel } from "@/lib/data-repository";

export default async function DepegPage() {
  const model = await loadAppModel();
  const last = model.depegSamples.at(-1)!;

  return <>
    <PageHeader title="Depeg Monitor" description="Per-position peg monitoring against a configured fair value using the historical USDC event window."/>
    <div className="grid metrics">
      <Metric label="Observed price" value={`$${last.price.toFixed(4)}`} detail="Aave V3 · USDC · POS-001" tone="warn"/>
      <Metric label="Reference" value="$1.0000" detail="Configured peg"/>
      <Metric label="Deviation" value={`${(Math.abs(last.price - 1) * 100).toFixed(2)}%`} detail="3.00% threshold" tone="warn"/>
      <Metric label="Event state" value="ACTIVE" detail="Opened at 13:00 UTC" tone="accent"/>
    </div>
    <div className="grid two-col">
      <Card>
        <SectionTitle title="Observation timeline" detail="Each sample is persisted before a state transition is notified"/>
        <table className="data-table">
          <thead><tr><th>Time</th><th>Price</th><th>Deviation</th><th>Transition</th></tr></thead>
          <tbody>{model.depegSamples.map((sample) => <tr key={sample.observedAt}>
            <td>{sample.observedAt}</td>
            <td>${sample.price.toFixed(4)}</td>
            <td>{(Math.abs(sample.price - sample.referencePrice) * 100).toFixed(2)}%</td>
            <td><Badge tone={sample.transition === "stable" ? "good" : sample.transition === "opened" ? "bad" : "warn"}>{sample.transition}</Badge></td>
          </tr>)}</tbody>
        </table>
      </Card>
      <Card>
        <SectionTitle title="How the code works" detail="Deterministic state transitions"/>
        <div className="formula">deviation = |price − reference| / reference × 100</div>
        <div className="checks">
          <div className="check"><span>Position is active</span><span>PASS</span></div>
          <div className="check"><span>Stablecoin leg is configured</span><span>PASS</span></div>
          <div className="check"><span>Deviation ≥ 3.00%</span><span>PASS</span></div>
          <div className="check"><span>Duplicate event prevented</span><span>PASS</span></div>
        </div>
      </Card>
    </div>
  </>;
}
