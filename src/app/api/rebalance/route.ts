import { validateAllocation } from "../../../../src/constrained-allocation.mjs";
import { readSession } from "@/lib/session";

export async function POST() {
  if (!await readSession()) return Response.json({ error: "Authentication required" }, { status: 401 });
  const proposal = { budget: 1_000_000, capitalBase: 10_000_000, candidates: [{ id: "AAVE-USDC-ALLOCATION", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 1_000_000 }], limits: { minimumAllocation: 100_000, maximumAllocation: 5_000_000, poolCaps: { standalone: 0.1 }, protocolCaps: { 1: 0.8 }, tierBudgets: { 1: 1 } } };
  return Response.json({ proposal, validation: validateAllocation(proposal), transactionSubmitted: false });
}
