import { PositionWorkbench } from "@/components/position-workbench";
import { operationalPositions } from "@/lib/view-data";

export default function LendingPage() {
  return <PositionWorkbench
    activity="Lending"
    description="Supplied assets, rates, collateral availability, and position state"
    initialRows={operationalPositions.lending}
    chartTitle="Lending exposure by protocol"
    chartData={[{ label: "Aave V3", value: 5_000_000, tone: "lending" }]}
    columns={[
      { key: "protocol", label: "Protocol" },
      { key: "client", label: "Client" },
      { key: "asset", label: "Asset supplied" },
      { key: "quantity", label: "Quantity", align: "right", format: "number" },
      { key: "total", label: "Total", align: "right", format: "usd" },
      { key: "expectedApy", label: "Expected APY", align: "right", format: "percent" },
      { key: "currentApy", label: "Current APY", align: "right", format: "percent" },
      { key: "collateralUse", label: "Collateral" },
      { key: "started", label: "Started" },
      { key: "status", label: "Status", format: "status" },
    ]}
    fields={[
      { name: "protocol", label: "Protocol", placeholder: "Aave V3", required: true },
      { name: "client", label: "Client ID", placeholder: "Treasury", required: true },
      { name: "asset", label: "Asset supplied", placeholder: "USDC", required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      { name: "price", label: "Asset price (USD)", type: "number", required: true },
      { name: "total", label: "Position value (USD)", type: "number", required: true },
      { name: "expectedApy", label: "Expected APY (%)", type: "number" },
      { name: "currentApy", label: "Current APY (%)", type: "number" },
      { name: "collateralUse", label: "Collateral state", placeholder: "Available" },
      { name: "started", label: "Start date", type: "date", required: true },
    ]}
  />;
}
