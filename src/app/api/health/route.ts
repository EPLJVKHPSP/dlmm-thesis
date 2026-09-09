import { databaseAvailable } from "@/lib/data-repository";

export async function GET() {
  return Response.json({ ok: true, application: "dlmm-thesis", dataSource: await databaseAvailable() ? "postgres" : "snapshot", transactionsEnabled: false });
}
