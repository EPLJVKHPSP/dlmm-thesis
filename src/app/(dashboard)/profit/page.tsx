import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart, NavLineChart } from "@/components/charts";
import { navHistory, periodIncome, assessmentPeriod } from "@/lib/view-data";

const usd = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function ProfitPage() {
  const { rows, netIncome, netApy, borrowingCost } = periodIncome();
  const incomeOf = (kind: string) => rows.find((row) => row.kind === kind)!.income;

  return <>
    <PageHeader title="MM Performance" description="Fund performance by activity, protocol, and accounting period"/>
    <div className="grid metrics"><Metric label="Current NAV" value="$10,000,000" detail="Assessment snapshot" tone="accent"/><Metric label="Capital deployed" value="$9,000,000" detail="90.0% utilization" tone="good"/><Metric label="Net income" value={usd(netIncome)} detail={`Expected to date · ${assessmentPeriod.elapsedDays}/${assessmentPeriod.totalDays} days`} tone="good"/><Metric label="Net performance" value={`${netApy.toFixed(2)}%`} detail="Expected, ann. · net of borrowing"/></div>
    <Card><SectionTitle title="NAV and invested capital" detail="Monthly assessment snapshots"/><NavLineChart data={navHistory}/></Card>
    <div className="spacer"/>
    <div className="grid two-col equal-cols"><Card><SectionTitle title="Income by activity" detail="Expected to date, pro-rata from displayed APYs"/><DonutChart data={[{ label: "Lending", value: incomeOf("Lending"), tone: "lending" }, { label: "Staking", value: incomeOf("Staking"), tone: "staking" }, { label: "Farming", value: incomeOf("Farming"), tone: "farming" }]}/><div className="spacer"/><div className="checks"><div className="check"><span>Borrowing costs (Kamino · 5.10%)</span><span>−{usd(borrowingCost)}</span></div></div></Card><Card><SectionTitle title="Income by protocol" detail="Expected to date"/><DonutChart data={[{ label: "Aave V3", value: incomeOf("Lending") }, { label: "Lido", value: incomeOf("Staking") }, { label: "Curve", value: incomeOf("Farming") }]}/></Card></div>
  </>;
}
