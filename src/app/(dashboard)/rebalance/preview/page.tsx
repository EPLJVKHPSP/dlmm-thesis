import Link from "next/link";
import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart } from "@/components/charts";
import { RebalanceSteps } from "@/components/rebalance-steps";
import { parseIds, parseIdle, selectionStats, deployableUsd, buildTarget } from "@/lib/rebalance-flow.mjs";
import { positionSnapshot } from "@/lib/reference-data";
import { strategyRows, protocolRatings } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ ids?: string | string[]; idle?: string }> }) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids, positionSnapshot.map((p) => p.id));
  const idle = parseIdle(sp.idle);
  const stats = selectionStats(positionSnapshot, ids);
  const deployable = deployableUsd(positionSnapshot, ids, idle);

  if (ids.length === 0 && idle <= 0) {
    return <><RebalanceSteps/><PageHeader title="Preview" description="Step 4 — current versus proposed book."/>
      <Card><p className="notice">Nothing to preview yet. <Link href="/rebalance/select">Start at Step 1</Link>.</p></Card></>;
  }

  const current = [...stats.retained, ...stats.selected];
  const currentByProtocol = new Map<string, number>();
  for (const p of current) currentByProtocol.set(p.protocol, (currentByProtocol.get(p.protocol) ?? 0) + p.principalUsd);
  const { candidates, top } = buildTarget(strategyRows, protocolRatings, deployable);
  const proposedByProtocol = new Map(currentByProtocol);
  for (const p of stats.selected) proposedByProtocol.set(p.protocol, (proposedByProtocol.get(p.protocol) ?? 0) - p.principalUsd);
  for (const c of candidates) proposedByProtocol.set(c.protocol, (proposedByProtocol.get(c.protocol) ?? 0) + c.allocation);
  const entries = [...new Set([...currentByProtocol.keys(), ...proposedByProtocol.keys()])];
  const qs = new URLSearchParams([...ids.map((id) => ["ids", id]), ["idle", String(idle)], ["confirmed", "1"]]).toString();

  return <>
    <RebalanceSteps/>
    <PageHeader title="Preview" description={`Step 4 — current versus proposed book for ${usd(deployable)} deployable capital.`}/>
    <div className="grid metrics">
      <Metric label="Exits" value={String(stats.tickedCount)} detail={usd(stats.freedUsd)}/>
      <Metric label="Target" value={top?.protocol ?? "—"} detail={top ? `${top.pool} · ${top.apy.toFixed(2)}% decision APY` : "No eligible pool"}/>
      <Metric label="Deployable" value={usd(deployable)} detail={`Freed + ${usd(idle)} idle`}/>
    </div>
    <div className="grid two-col equal-cols">
      <Card><SectionTitle title="Current book" detail="By protocol"/><DonutChart data={[...currentByProtocol].map(([label, value]) => ({ label, value }))}/></Card>
      <Card><SectionTitle title="Proposed book" detail="Exits removed, target added"/><DonutChart data={[...proposedByProtocol].filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }))}/></Card>
    </div>
    <div className="spacer"/>
    <Card><SectionTitle title="Book delta" detail="Protocol share before → after"/>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Protocol</th><th className="align-right">Current</th><th className="align-right">Proposed</th><th className="align-right">Delta</th></tr></thead><tbody>
        {entries.map((protocol) => {
          const before = currentByProtocol.get(protocol) ?? 0;
          const after = proposedByProtocol.get(protocol) ?? 0;
          return <tr key={protocol}><td><strong>{protocol}</strong></td><td className="align-right">{usd(before)}</td><td className="align-right">{usd(after)}</td><td className="align-right">{after >= before ? "+" : "−"}{usd(Math.abs(after - before))}</td></tr>;
        })}
      </tbody></table></div>
      <div className="spacer"/>
      <Link className="button" href={`/rebalance/guideline?${qs}`}>Continue to Execute</Link>
    </Card>
  </>;
}
