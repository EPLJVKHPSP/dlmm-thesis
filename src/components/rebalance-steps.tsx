"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const STEPS = [
  { href: "/rebalance/select", label: "Select", step: 1 },
  { href: "/rebalance/idle", label: "Idle assets", step: 2 },
  { href: "/rebalance", label: "Run Optimization", step: 3 },
  { href: "/rebalance/preview", label: "Preview", step: 4 },
  { href: "/rebalance/guideline", label: "Execute", step: 5 },
];

export function RebalanceSteps() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const suffix = query ? `?${query}` : "";
  return <div className="subnav">
    {STEPS.map((s) => {
      const active = pathname === s.href;
      return <Link key={s.href} href={`${s.href}${suffix}`} className={active ? "active" : ""} aria-current={active ? "step" : undefined}>
        {s.step}. {s.label}
      </Link>;
    })}
  </div>;
}
