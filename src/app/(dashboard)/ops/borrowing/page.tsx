import { PositionWorkbench } from "@/components/position-workbench";
import { operationalPositions } from "@/lib/view-data";

export default function BorrowingPage() {
  return <PositionWorkbench
    activity="Borrowing"
    description="Debt positions, collateral values, LTV, and liquidation limits"
    initialRows={operationalPositions.borrowing}
    chartTitle="Borrowing exposure by protocol"
    chartData={[{ label: "Kamino Lend", value: 2_000_000, tone: "borrowing" }]}
    columns={[
      { key: "protocol", label: "Protocol" },
      { key: "client", label: "Client" },
      { key: "asset", label: "Borrowed asset" },
      { key: "total", label: "Debt", align: "right", format: "usd" },
      { key: "collateral", label: "Collateral" },
      { key: "collateralValue", label: "Collateral value", align: "right", format: "usd" },
      { key: "ltv", label: "LTV", align: "right", format: "percent" },
      { key: "liquidationLtv", label: "Liquidation LTV", align: "right", format: "percent" },
      { key: "started", label: "Started" },
      { key: "status", label: "Status", format: "status" },
    ]}
    fields={[
      { name: "protocol", label: "Protocol", placeholder: "Kamino Lend", required: true },
      { name: "client", label: "Client ID", placeholder: "Treasury", required: true },
      { name: "asset", label: "Borrowed asset", placeholder: "USDC", required: true },
      { name: "quantity", label: "Borrowed quantity", type: "number", required: true },
      { name: "total", label: "Debt value (USD)", type: "number", required: true },
      { name: "collateral", label: "Collateral asset", placeholder: "mSOL", required: true },
      { name: "collateralValue", label: "Collateral value (USD)", type: "number", required: true },
      { name: "ltv", label: "LTV (%)", type: "number", required: true },
      { name: "liquidationLtv", label: "Liquidation LTV (%)", type: "number", required: true },
      { name: "started", label: "Start date", type: "date", required: true },
    ]}
  />;
}
