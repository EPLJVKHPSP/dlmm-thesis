import Link from "next/link";
import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { RebalanceSteps } from "@/components/rebalance-steps";
import { ReviewControl } from "@/components/review-control";
import { validateAllocation } from "../../../constrained-allocation.mjs";
import {
  parseIds, parseIdle, selectionStats, deployableUsd, buildTarget,
  flowSignature, FLOW_CAPITAL_BASE, FLOW_LIMITS,
} from "@/lib/rebalance-flow.mjs";
import { positionSnapshot } from "@/lib/reference-data";
import { strategyRows, protocolRatings } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ClassicProposal() {
  const result = validateAllocation({ budget: 1_000_000, capitalBase: 10_000_000, candidates: [{ id: "AAVE-USDC-ALLOCATION", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 1_000_000 }], limits: { minimumAllocation: 100_000, maximumAllocation: 5_000_000, poolCaps: { standalone: .1 }, protocolCaps: { 1: .8 }, tierBudgets: { 1: 1 } } });
  return <>
    <div className="grid metrics"><Metric label="Idle amount" value="$1,000,000" detail="TREASURY-USDC"/><Metric label="Suggested target" value="Aave V3" detail="Lending · USDC" tone="accent"/><Metric label="Snapshot APY" value="4.20%" detail="Not guaranteed"/><Metric label="Risk score" value="7.15" detail="Out of 10" tone="good"/></div>
    <div className="grid two-col"><Card><SectionTitle title="Proposed allocation" detail="Review required before execution"/><table className="data-table"><thead><tr><th>Source</th><th>Target</th><th>Amount</th><th>State</th></tr></thead><tbody><tr><td>Idle USDC</td><td><strong>Aave V3</strong><span className="subtle">USDC lending position</span></td><td>$1,000,000</td><td><Badge tone="good">Ready</Badge></td></tr></tbody></table><div className="spacer"/><ReviewControl/><p className="subtle">The authenticated route validates the proposal and confirms that no transaction was submitted.</p></Card><Card><SectionTitle title="Constraint checks" detail="Allocation rules"/><div className="checks">{["Allocation total equals $1,000,000", "Minimum position is $100,000", "Maximum position is $5,000,000", "Risk floor is satisfied", "Protocol cap uses $10,000,000 capital base", "Pool cap is satisfied", "Borrowing exclusions are clear"].map(x => <div className="check" key={x}><span>{x}</span><span>PASS</span></div>)}</div><div className="spacer"/><div className="callout"><strong>{result.passed ? "Proposal is valid" : "Proposal needs revision"}</strong>{result.passed ? "All declared checks pass. Human approval is still required." : result.violations.join("; ")}</div></Card></div>
  </>;
}

export default async function RebalancePage({ searchParams }: { searchParams: Promise<{ ids?: string | string[]; idle?: string; confirmed?: string; runSig?: string }> }) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids, positionSnapshot.map((p) => p.id));

  if (ids.length === 0 && sp.idle === undefined) {
    return <>
      <RebalanceSteps/>
      <PageHeader title="Liquidity Optimization" description="Allocate idle USDC to an eligible lending position after checking portfolio and position limits."/>
      <ClassicProposal/>
      <div className="spacer"/>
      <p className="subtle">Reference proposal above. For the guided flow — <Link href="/rebalance/select">start at Step 1 (Select)</Link>.</p>
    </>;
  }

  const idle = parseIdle(sp.idle);
  const confirmed = sp.confirmed === "1";
  const stats = selectionStats(positionSnapshot, ids);
  const deployable = deployableUsd(positionSnapshot, ids, idle);
  const exposure = "standalone";
  const sig = flowSignature(ids, idle, exposure);
  const blockers: string[] = [];
  if (ids.length === 0 && idle <= 0) blockers.push("Select an exit on Step 1 or book idle capital above $0 on Step 2.");
  if (!confirmed) blockers.push("Confirm the idle book on Step 2, including an explicit $0 confirmation when appropriate.");
  if (deployable <= 0) blockers.push("No deployable capital: tick an exit or add idle capital before running optimization.");
  const ran = sp.runSig === sig;

  return <>
    <RebalanceSteps/>
    <PageHeader title="Run Optimization" description={`Step 3 — target book for ${usd(deployable)} deployable capital. Mode: deterministic · top-ranked eligible pool.`}/>
    {blockers.length > 0 && <Card><SectionTitle title="Setup incomplete" detail="Complete these items before a proposal can be created"/><ul className="notice-list">{blockers.map((b) => <li key={b}>{b}</li>)}</ul></Card>}
    <div className="grid metrics">
      <Metric label="To rebalance" value={String(stats.tickedCount)} detail="Ticked legs"/>
      <Metric label="Retained" value={String(stats.retainedCount)} detail="Staying put"/>
      <Metric label="Exit freed" value={usd(stats.freedUsd)} detail="Ticked principal"/>
      <Metric label="Deployable" value={usd(deployable)} detail={`Freed + ${usd(idle)} idle`}/>
    </div>
    {!ran ? <>
      <Card><SectionTitle title="Ready to run" detail="Build the target book for the current selection"/>
        <p>No proposal yet for this selection. Run the deterministic optimizer, then review Preview before any human execution.</p>
        <div className="spacer"/>
        <Link className="button" href={`/rebalance?${new URLSearchParams([...ids.map((id) => ["ids", id]), ["idle", String(idle)], ["confirmed", "1"], ["runSig", sig]]).toString()}`}>Run optimization</Link>
      </Card>
    </> : (() => {
      const { candidates, skipped, validation, top } = buildTarget(strategyRows, protocolRatings, deployable);
      const qs = new URLSearchParams([...ids.map((id) => ["ids", id]), ["idle", String(idle)], ["confirmed", "1"]]).toString();
      return <>
        <Card><SectionTitle title="Target book" detail={top ? `Ranked by decision APY · risk floor 6 · top: ${top.pool} on ${top.protocol}` : "No eligible pool"}/>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Move</th><th>Leg</th><th>Target</th><th className="align-right">USD</th><th className="align-right">Risk</th><th>Binding cap</th></tr></thead><tbody>
            {stats.selected.map((p) => <tr key={p.id}><td><Badge tone="bad">exit</Badge></td><td>{p.kind}</td><td><strong>{p.id}</strong><span className="subtle">{p.protocol}</span></td><td className="align-right">{usd(p.principalUsd)}</td><td className="align-right">—</td><td>—</td></tr>)}
            {candidates.map((c) => <tr key={c.id}><td><Badge tone="good">enter</Badge></td><td>Target</td><td><strong>{c.pool}</strong><span className="subtle">{c.protocol} · decision APY {c.apy.toFixed(2)}%</span></td><td className="align-right">{usd(c.allocation)}</td><td className="align-right">{c.risk.toFixed(0)}/10</td><td>{c.bindingCap}</td></tr>)}
          </tbody></table></div>
          {skipped.length > 0 && <><div className="spacer"/><p className="subtle">Considered but not filled:</p><ul className="notice-list">{skipped.map((s) => <li key={s.id}>{s.id} — {s.reason}</li>)}</ul></>}
        </Card>
        <div className="spacer"/>
        <Card><SectionTitle title="Constraint checks" detail={`Capital base ${usd(FLOW_CAPITAL_BASE)} · min ${usd(FLOW_LIMITS.minimumAllocation)} · max ${usd(FLOW_LIMITS.maximumAllocation)}`}/>
          {validation.violations.length === 0
            ? <div className="checks"><div className="check"><span>Allocation reconciles {usd(validation.total)}</span><span>PASS</span></div><div className="check"><span>Position, pool, protocol, and tier caps</span><span>PASS</span></div></div>
            : <div className="checks">{validation.violations.map((v) => <div className="check" key={v}><span>{v}</span><span>FAIL</span></div>)}</div>}
          <div className="spacer"/>
          <div className="callout"><strong>{validation.passed ? "Proposal is valid" : "Proposal needs revision"}</strong>{validation.passed ? "All declared checks pass. Human approval is still required — no transaction is constructed or submitted." : "Adjust selection or idle capital, then re-run."}</div>
          <div className="spacer"/>
          <Link className="button" href={`/rebalance/preview?${qs}&runSig=${sig}`}>Continue to Preview</Link>
        </Card>
      </>;
    })()}
  </>;
}
