import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart } from "@/components/charts";
import { assessmentPeriod, periodIncome } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function AssessmentPeriodPage() {
  const { rows, netIncome, netApy } = periodIncome();
  const borrowing = rows.find((r) => r.kind === "Borrowing")!;

  return <>
    <PageHeader title="Assessment Period" description="Dated valuation, income, expenses, and investor accounting"/>
    <div className="grid metrics"><Metric label="Period" value="2026-Q3" detail="01 Jul – 30 Sep 2026" tone="accent"/><Metric label="Opening NAV" value="$9,730,000" detail="Previous close"/><Metric label="Current NAV" value="$10,000,000" detail="Latest valuation" tone="good"/><Metric label="Status" value="Open" detail="Assessment in progress" tone="warn"/></div>
    <div className="grid metrics"><Metric label="Period APY" value={`${netApy.toFixed(2)}%`} detail={`Expected, ann. · net of borrowing · ${assessmentPeriod.elapsedDays}/${assessmentPeriod.totalDays} days`} tone="accent"/><Metric label="Income to date" value={usd(netIncome)} detail="Expected, pro-rata from displayed APYs"/><Metric label="Borrowing cost" value={usd(-rows.find((r) => r.kind === "Borrowing")!.income)} detail="Kamino Lend · 5.10% on $2.0M"/><Metric label="Capital used" value={usd(assessmentPeriod.deployed)} detail="Deployed across 4 positions"/></div>
    <div className="grid two-col equal-cols"><Card><SectionTitle title="Period allocation" detail="By activity"/><DonutChart data={[{ label: "Lending", value: 5_000_000, tone: "lending" }, { label: "Borrowing", value: 2_000_000, tone: "borrowing" }, { label: "Staking", value: 1_900_000, tone: "staking" }, { label: "Farming", value: 100_000, tone: "farming" }, { label: "Idle", value: 1_000_000, tone: "idle" }]}/></Card><Card><SectionTitle title="Assessment status" detail="Current close workflow"/><div className="checks"><div className="check"><span>Position valuations recorded</span><span>READY</span></div><div className="check"><span>Yield and reward income recorded</span><span>READY</span></div><div className="check"><span>Borrowing costs reconciled</span><span>READY</span></div><div className="check"><span>Final close</span><Badge tone="warn">PENDING</Badge></div></div></Card></div>
    <div className="spacer"/>
    <Card><SectionTitle title="Period yield by activity" detail="Expected, pro-rata from displayed APYs · borrowing as cost"/><div className="table-wrap"><table className="data-table"><thead><tr><th>Activity</th><th>Protocol</th><th className="align-right">Deployed</th><th className="align-right">APY</th><th className="align-right">Income to date</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.kind}><td><strong>{row.kind}</strong></td><td>{row.protocol}</td><td className="align-right">{usd(row.principalUsd)}</td><td className="align-right">{row.apy.toFixed(2)}%</td><td className="align-right">{row.income < 0 ? `−${usd(-row.income)}` : usd(row.income)}</td></tr>)}
      <tr><td><strong>Net</strong><span className="subtle">On $9.0M used</span></td><td>—</td><td className="align-right">{usd(assessmentPeriod.deployed)}</td><td className="align-right">{netApy.toFixed(2)}%</td><td className="align-right">{usd(netIncome)}</td></tr>
    </tbody></table></div></Card>
    <div className="spacer"/>
    <Card><SectionTitle title="Assessment history" detail="Recorded periods"/><div className="table-wrap"><table className="data-table"><thead><tr><th>Period</th><th>Opened</th><th>Closed</th><th className="align-right">Opening NAV</th><th className="align-right">Closing NAV</th><th className="align-right">APY</th><th>Status</th></tr></thead><tbody>{assessmentPeriod.history.map((row) => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.opened}</td><td>{row.closed}</td><td className="align-right">{usd(row.openingNav)}</td><td className="align-right">{usd(row.closingNav)}</td><td className="align-right">{row.apy == null ? "—" : `${row.apy.toFixed(2)}%`}</td><td><Badge tone={row.status === "Open" ? "warn" : "good"}>{row.status}</Badge></td></tr>)}</tbody></table></div><p className="subtle">Q2 APY is realized from NAV deltas, annualized. Q3 closes with assessed income, not projections.</p></Card>
  </>;
}
