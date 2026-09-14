import { PositionWorkbench } from "@/components/position-workbench";
import { operationalPositions } from "@/lib/view-data";

export default function StakingPage() {
  return <PositionWorkbench
    activity="Staking"
    description="Active staking positions, receipt assets, and realized performance"
    initialRows={operationalPositions.staking}
    chartTitle="Staking exposure by token"
    chartData={[{ label: "stETH", value: 1_900_000, tone: "staking" }]}
    columns={[
      { key: "platform", label: "Platform" },
      { key: "client", label: "Client" },
      { key: "token", label: "Token" },
      { key: "quantity", label: "Quantity", align: "right", format: "number" },
      { key: "total", label: "Total", align: "right", format: "usd" },
      { key: "receipt", label: "LST" },
      { key: "expectedApy", label: "Expected APY", align: "right", format: "percent" },
      { key: "realizedApy", label: "Realized APY", align: "right", format: "percent" },
      { key: "started", label: "Started" },
      { key: "status", label: "Status", format: "status" },
    ]}
    fields={[
      { name: "platform", label: "Platform", placeholder: "Lido", required: true },
      { name: "client", label: "Client ID", placeholder: "Treasury", required: true },
      { name: "token", label: "Token", placeholder: "ETH", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      { name: "total", label: "Position value (USD)", type: "number", required: true },
      { name: "receipt", label: "LST token", placeholder: "stETH" },
      { name: "expectedApy", label: "Expected APY (%)", type: "number" },
      { name: "realizedApy", label: "Realized APY (%)", type: "number" },
      { name: "started", label: "Start date", type: "date", required: true },
    ]}
  />;
}
