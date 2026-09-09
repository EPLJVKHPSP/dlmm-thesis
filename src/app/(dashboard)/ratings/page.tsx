import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { protocolRatings } from "@/lib/view-data";

const tierTone = (tier: number) => tier <= 2 ? "good" as const : tier === 3 ? "warn" as const : "bad" as const;

export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ q?: string; chain?: string; tier?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const rows = protocolRatings.filter((row) =>
    (!query || `${row.protocol} ${row.chain}`.toLowerCase().includes(query)) &&
    (!params.chain || row.chain === params.chain) &&
    (!params.tier || row.riskTier === Number(params.tier))
  );
  const chains = [...new Set(protocolRatings.map((row) => row.chain))];

  return <>
    <PageHeader title="Ratings" description="Protocol ratings, risk tiers, and policy placement"/>
    <Card className="filter-card">
      <form method="get" className="filter-row">
        <label className="filter-grow"><span>Search</span><input name="q" defaultValue={params.q ?? ""} placeholder="Protocol or chain"/></label>
        <label><span>Chain</span><select name="chain" defaultValue={params.chain ?? ""}><option value="">All chains</option>{chains.map((chain) => <option key={chain}>{chain}</option>)}</select></label>
        <label><span>Risk tier</span><select name="tier" defaultValue={params.tier ?? ""}><option value="">All tiers</option>{[1, 2, 3, 4].map((tier) => <option key={tier} value={tier}>T{tier}</option>)}</select></label>
        <button className="button" type="submit">Apply</button>
        <a className="button-secondary" href="/ratings">Reset</a>
      </form>
    </Card>
    <div className="spacer"/>
    <Card>
      <SectionTitle title="Protocols" detail={`${rows.length} rated · policy tier vs risk tier`}/>
      <div className="table-wrap"><table className="data-table ratings-table">
        <thead><tr><th>Protocol</th><th>Chain</th><th className="align-right">Score</th><th className="align-right">Risk tier</th><th className="align-right">Policy tier</th><th>Source</th><th>Updated</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.protocol}><td><strong>{row.protocol}</strong></td><td>{row.chain}</td><td className="align-right score-cell">{row.score}/10</td><td className="align-right"><Badge tone={tierTone(row.riskTier)}>T{row.riskTier}</Badge></td><td className="align-right">T{row.policyTier}</td><td className="subtle-cell">{row.source}</td><td className="subtle-cell nowrap">{row.updated}</td></tr>)}</tbody>
      </table></div>
    </Card>
  </>;
}
