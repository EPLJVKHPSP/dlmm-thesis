import { PositionWorkbench } from "@/components/position-workbench";
import { operationalPositions } from "@/lib/view-data";

export default function FarmingPage() {
  return <PositionWorkbench
    activity="Farming"
    description="Liquidity-pool positions, yield, harvests, and impermanent loss"
    initialRows={operationalPositions.farming}
    chartTitle="Farming exposure by platform"
    chartData={[{ label: "Curve", value: 100_000, tone: "farming" }]}
    columns={[
      { key: "platform", label: "Platform" },
      { key: "client", label: "Client" },
      { key: "pair", label: "Pool" },
      { key: "total", label: "Total", align: "right", format: "usd" },
      { key: "expectedApy", label: "Expected APY", align: "right", format: "percent" },
      { key: "realizedApy", label: "Realized APY", align: "right", format: "percent" },
      { key: "impermanentLoss", label: "IL P&L", align: "right", format: "usd" },
      { key: "started", label: "Started" },
      { key: "status", label: "Status", format: "status" },
    ]}
    fields={[
      { name: "platform", label: "Platform", placeholder: "Curve", required: true },
      { name: "client", label: "Client ID", placeholder: "Treasury", required: true },
      { name: "pair", label: "Pool", placeholder: "DAI / USDC", required: true },
      { name: "token1", label: "Token 1", placeholder: "DAI", required: true },
      { name: "token2", label: "Token 2", placeholder: "USDC", required: true },
      { name: "total", label: "Position value (USD)", type: "number", required: true },
      { name: "expectedApy", label: "Expected APY (%)", type: "number" },
      { name: "realizedApy", label: "Realized APY (%)", type: "number" },
      { name: "impermanentLoss", label: "IL P&L (USD)", type: "number" },
      { name: "started", label: "Start date", type: "date", required: true },
    ]}
  />;
}
