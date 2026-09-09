import { Badge, Card, Metric, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart } from "@/components/charts";
import { strategyRows } from "@/lib/view-data";

const compactUsd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);

export default async function StrategiesPage({ searchParams }: { searchParams: Promise<{ q?: string; exposure?: string; tier?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const rows = strategyRows.filter((row) =>
    (!query || `${row.pool} ${row.protocol} ${row.chain}`.toLowerCase().includes(query)) &&
    (!params.exposure || row.exposure === params.exposure) &&
    (!params.tier || row.tier === Number(params.tier))
  );
  const depth = rows.reduce((sum, row) => sum + row.tvl, 0);
  const weightedApy = depth ? rows.reduce((sum, row) => sum + row.apy * row.tvl, 0) / depth : 0;
  const protocols = [...new Map(rows.map((row) => [row.protocol, row.tvl])).entries()].map(([label, value]) => ({ label, value }));
  const exposures = [...new Set(strategyRows.map((row) => row.exposure))];

  return <>
    <PageHeader title="Strategies" description="Market depth, recorded yields, and strategy status"/>
    <div className="grid metrics strategy-metrics">
      <Metric label="Pools screened" value={String(rows.length)} detail="Current filters"/>
      <Metric label="Combined depth" value={compactUsd(depth)} detail="Across listed pools" tone="accent"/>
      <Metric label="Weighted APY" value={`${weightedApy.toFixed(2)}%`} detail="Depth-weighted" tone="good"/>
      <Metric label="Protocols" value={String(new Set(rows.map((row) => row.protocol)).size)} detail="Real protocol entries"/>
    </div>
    <div className="grid strategy-top">
      <Card className="filter-card"><SectionTitle title="Filters" detail="Screen the strategy list"/><form method="get" className="filter-stack"><label><span>Search</span><input name="q" defaultValue={params.q ?? ""} placeholder="Pool, protocol, or chain"/></label><label><span>Exposure</span><select name="exposure" defaultValue={params.exposure ?? ""}><option value="">All exposures</option>{exposures.map((exposure) => <option key={exposure}>{exposure}</option>)}</select></label><label><span>Risk tier</span><select name="tier" defaultValue={params.tier ?? ""}><option value="">All tiers</option><option value="1">T1</option><option value="2">T2</option></select></label><div className="filter-buttons"><button className="button" type="submit">Apply</button><a className="button-secondary" href="/strategies">Reset</a></div></form></Card>
      <Card><SectionTitle title="Depth by protocol" detail="Pools currently displayed"/><DonutChart data={protocols}/></Card>
    </div>
    <div className="spacer"/>
    <Card><SectionTitle title="Pools" detail={`${rows.length} results · ${compactUsd(depth)} combined depth`}/><div className="table-wrap"><table className="data-table"><thead><tr><th>Pool</th><th>Exposure</th><th>Protocol</th><th>Chain</th><th className="align-right">Tier</th><th className="align-right">APY</th><th className="align-right">Decision APY</th><th className="align-right">TVL</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.protocol}-${row.pool}`}><td><strong>{row.pool}</strong></td><td>{row.exposure}</td><td>{row.protocol}</td><td>{row.chain}</td><td className="align-right"><Badge tone={row.tier === 1 ? "good" : "info"}>T{row.tier}</Badge></td><td className="align-right">{row.apy.toFixed(2)}%</td><td className="align-right"><strong>{row.decisionApy.toFixed(2)}%</strong></td><td className="align-right">{compactUsd(row.tvl)}</td><td><Badge tone={row.status === "Active" ? "good" : row.status === "Watch" ? "warn" : "info"}>{row.status}</Badge></td></tr>)}</tbody></table></div></Card>
  </>;
}
