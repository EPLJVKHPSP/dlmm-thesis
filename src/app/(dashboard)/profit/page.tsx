import { Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart, NavLineChart } from "@/components/charts";
import { navHistory } from "@/lib/view-data";

export default function ProfitPage() {
  return <>
    <PageHeader title="MM Performance" description="Fund performance by activity, protocol, and accounting period"/>
    <div className="grid metrics"><Metric label="Current NAV" value="$10,000,000" detail="Assessment snapshot" tone="accent"/><Metric label="Capital deployed" value="$9,000,000" detail="90.0% utilization" tone="good"/><Metric label="Period income" value="$31,420" detail="Recorded yield and rewards" tone="good"/><Metric label="Net performance" value="0.32%" detail="Current assessment period"/></div>
    <Card><SectionTitle title="NAV and invested capital" detail="Monthly assessment snapshots"/><NavLineChart data={navHistory}/></Card>
    <div className="spacer"/>
    <div className="grid two-col equal-cols"><Card><SectionTitle title="Income by activity" detail="Current period"/><DonutChart data={[{ label: "Lending", value: 17_500 }, { label: "Staking", value: 9_820 }, { label: "Farming", value: 4_100 }]}/></Card><Card><SectionTitle title="Income by protocol" detail="Current period"/><DonutChart data={[{ label: "Aave V3", value: 17_500 }, { label: "Lido", value: 9_820 }, { label: "Curve", value: 4_100 }]}/></Card></div>
  </>;
}
