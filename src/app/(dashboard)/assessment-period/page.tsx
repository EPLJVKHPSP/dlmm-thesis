import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart } from "@/components/charts";

export default function AssessmentPeriodPage() {
  return <>
    <PageHeader title="Assessment Period" description="Dated valuation, income, expenses, and investor accounting"/>
    <div className="grid metrics"><Metric label="Period" value="2026-Q3" detail="01 Jul – 30 Sep 2026" tone="accent"/><Metric label="Opening NAV" value="$9,730,000" detail="Previous close"/><Metric label="Current NAV" value="$10,000,000" detail="Latest valuation" tone="good"/><Metric label="Status" value="Open" detail="Assessment in progress" tone="warn"/></div>
    <div className="grid two-col equal-cols"><Card><SectionTitle title="Period allocation" detail="By activity"/><DonutChart data={[{ label: "Lending", value: 5_000_000 }, { label: "Borrowing", value: 2_000_000, tone: "borrowing" }, { label: "Staking", value: 1_900_000 }, { label: "Farming", value: 100_000 }, { label: "Idle", value: 1_000_000 }]}/></Card><Card><SectionTitle title="Assessment status" detail="Current close workflow"/><div className="checks"><div className="check"><span>Position valuations recorded</span><span>READY</span></div><div className="check"><span>Yield and reward income recorded</span><span>READY</span></div><div className="check"><span>Borrowing costs reconciled</span><span>READY</span></div><div className="check"><span>Final close</span><Badge tone="warn">PENDING</Badge></div></div></Card></div>
    <div className="spacer"/>
    <Card><SectionTitle title="Assessment history" detail="Recorded periods"/><div className="table-wrap"><table className="data-table"><thead><tr><th>Period</th><th>Opened</th><th>Closed</th><th className="align-right">Opening NAV</th><th className="align-right">Closing NAV</th><th>Status</th></tr></thead><tbody><tr><td><strong>2026-Q3</strong></td><td>01 Jul 2026</td><td>—</td><td className="align-right">$9,730,000</td><td className="align-right">$10,000,000</td><td><Badge tone="warn">Open</Badge></td></tr><tr><td><strong>2026-Q2</strong></td><td>01 Apr 2026</td><td>30 Jun 2026</td><td className="align-right">$9,420,000</td><td className="align-right">$9,730,000</td><td><Badge tone="good">Closed</Badge></td></tr></tbody></table></div></Card>
  </>;
}
