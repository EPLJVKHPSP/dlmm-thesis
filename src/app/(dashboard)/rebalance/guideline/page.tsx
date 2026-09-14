import Link from "next/link";
import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { RebalanceSteps } from "@/components/rebalance-steps";
import { GuidelineChecklist } from "@/components/guideline-checklist";
import { parseIds, parseIdle, selectionStats, deployableUsd, buildGuidelineActions } from "@/lib/rebalance-flow.mjs";
import { positionSnapshot } from "@/lib/reference-data";
import { strategyRows, protocolRatings } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function GuidelinePage({ searchParams }: { searchParams: Promise<{ ids?: string | string[]; idle?: string }> }) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids, positionSnapshot.map((p) => p.id));
  const idle = parseIdle(sp.idle);
  const stats = selectionStats(positionSnapshot, ids);
  const deployable = deployableUsd(positionSnapshot, ids, idle);

  if (ids.length === 0 && idle <= 0) {
    return <><RebalanceSteps/><PageHeader title="Execute" description="Step 5 — manual execution guideline."/>
      <Card><p className="notice">No actions to execute yet. <Link href="/rebalance/select">Start at Step 1</Link>.</p></Card></>;
  }

  const actions = buildGuidelineActions(positionSnapshot, strategyRows, protocolRatings, ids, deployable);

  return <>
    <RebalanceSteps/>
    <PageHeader title="Execute" description="Step 5 — manual execution guideline. A human works through each row on the protocol itself."/>
    <div className="grid metrics">
      <Metric label="Actions" value={String(actions.length)} detail={`${stats.tickedCount} exits · ${actions.length - stats.tickedCount} enters`}/>
      <Metric label="Volume" value={usd(deployable)} detail="Deployable capital"/>
    </div>
    <Card>
      <SectionTitle title="Batched actions" detail="Tick each row as you complete it off-app"/>
      <GuidelineChecklist actions={actions}/>
    </Card>
  </>;
}
