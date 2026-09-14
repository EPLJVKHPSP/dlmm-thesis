import Link from "next/link";
import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { RebalanceSteps } from "@/components/rebalance-steps";
import { parseIds, selectionStats, deployableUsd, parseIdle } from "@/lib/rebalance-flow.mjs";
import { positionSnapshot } from "@/lib/reference-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const KNOWN_IDS = positionSnapshot.map((p) => p.id);

export default async function SelectPage({ searchParams }: { searchParams: Promise<{ ids?: string | string[] }> }) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids, KNOWN_IDS);
  const stats = selectionStats(positionSnapshot, ids);
  const idle = parseIdle(undefined);

  return <>
    <RebalanceSteps/>
    <PageHeader title="Select positions" description="Step 1 — tick exits to rebalance. Unticked positions are retained. Save, then confirm idle assets on Step 2."/>
    <div className="grid metrics">
      <Metric label="Active capital" value={usd(stats.activeCapital)} detail={`${stats.tickedCount + stats.retainedCount} active positions`}/>
      <Metric label="Selected to rebalance" value={String(stats.tickedCount)} detail="Exit legs"/>
      <Metric label="Exit freed" value={usd(stats.freedUsd)} detail="Ticked principal"/>
      <Metric label="Deployable" value={usd(deployableUsd(positionSnapshot, ids, idle))} detail={`Freed + ${usd(idle)} idle`}/>
    </div>
    <form action="/rebalance/idle" method="GET">
      <Card>
        <SectionTitle title="Selectable positions" detail="Tick to rebalance · untick to retain"/>
        <div className="table-wrap"><table className="data-table"><thead><tr><th></th><th>Position</th><th>Activity</th><th>Protocol</th><th className="align-right">Principal</th><th>Status</th></tr></thead><tbody>
          {[...stats.selected, ...stats.retained].map((p) => <tr key={p.id}>
            <td><input type="checkbox" name="ids" value={p.id} defaultChecked={ids.includes(p.id)} aria-label={`Select ${p.id}`}/></td>
            <td><strong>{p.id}</strong><span className="subtle">{p.asset}</span></td>
            <td>{p.kind}</td><td>{p.protocol}</td>
            <td className="align-right">{usd(p.principalUsd)}</td>
            <td><Badge tone={p.status === "Alert" ? "warn" : "good"}>{p.status}</Badge></td>
          </tr>)}
        </tbody></table></div>
        <div className="spacer"/>
        <button className="button" type="submit">Save & continue to idle assets</button>
      </Card>
    </form>
    <div className="spacer"/>
    <p className="subtle">Selection is kept in the page address while you move through the steps. <Link href="/rebalance/select">Reset</Link></p>
  </>;
}
