import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AppShell user={session}>{children}</AppShell>;
}
