import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { RebalanceSteps } from "@/components/rebalance-steps";
import { parseIds, selectionStats, deployableUsd, parseIdle, FLOW_DEFAULT_IDLE } from "@/lib/rebalance-flow.mjs";
import { positionSnapshot } from "@/lib/reference-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function IdlePage({ searchParams }: { searchParams: Promise<{ ids?: string | string[]; ok?: string }> }) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids, positionSnapshot.map((p) => p.id));
  const stats = selectionStats(positionSnapshot, ids);
  const idle = FLOW_DEFAULT_IDLE;
  const qs = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
  const back = qs ? `/rebalance/select?${qs}` : "/rebalance/select";

  return <>
    <RebalanceSteps/>
    <PageHeader title="Idle assets" description="Step 2 — book deployable cash by amount. Confirm explicitly, including $0, before optimization."/>
    {sp.ok === "confirmed" && <Card><p className="notice">Idle assets confirmed for the current selection. Step 3 is ready when deployable capital is above $0.</p></Card>}
    {ids.length === 0 && <Card><p className="notice">No exits selected — confirming here books an idle-only budget. To free position capital, go back to <a href={back}>Step 1</a>.</p></Card>}
    <div className="grid metrics">
      <Metric label="Idle cash" value={usd(idle)} detail="TREASURY-USDC"/>
      <Metric label="Exit freed" value={usd(stats.freedUsd)} detail={`${stats.tickedCount} ticked legs`}/>
      <Metric label="Deployable" value={usd(deployableUsd(positionSnapshot, ids, idle))} detail="Idle + exit freed"/>
    </div>
    <form action="/rebalance" method="GET">
      {ids.map((id) => <input key={id} type="hidden" name="ids" value={id}/>)}
      <Card>
        <SectionTitle title="Deployable cash" detail="Amount and explicit confirmation"/>
        <div className="form-grid">
          <label>Idle amount (USD)<input type="number" name="idle" defaultValue={idle} min={0} step={1000} required/></label>
          <label className="check-label"><input type="checkbox" name="confirmed" value="1" required/> I confirm this idle book for the current selection</label>
        </div>
        <div className="spacer"/>
        <button className="button" type="submit">Confirm & continue to optimization</button>
      </Card>
    </form>
  </>;
}
