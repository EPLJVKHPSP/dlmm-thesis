import { loadAppModel, loadDemoPortfolio } from "@/lib/data-repository";
import { readSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ walletId: string }> }) {
  if (!await readSession()) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { walletId } = await params;
  if (walletId === "DEMO-USDC") {
    const demo = await loadDemoPortfolio();
    return Response.json({ wallet: demo.wallet, positions: demo.positions, notice: "Read-only review data; no blockchain query or transaction is performed." });
  }
  const model = await loadAppModel();
  if (walletId !== model.wallet.id) return Response.json({ error: "Portfolio not found" }, { status: 404 });
  return Response.json({ wallet: model.wallet, positions: model.positions.filter((p) => p.walletId === walletId), notice: "Read-only review data; no blockchain query or transaction is performed." });
}
