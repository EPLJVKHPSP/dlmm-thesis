"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: "gauge" | "layers" | "target" | "scale" | "bell" | "activity" | "trend" | "coins" | "sprout" | "bank" | "search" | "calendar" };

const groups: { title: string; items: NavItem[] }[] = [
  { title: "Fund", items: [
    { href: "/", label: "Dashboard", icon: "gauge" },
    { href: "/positions", label: "Positions", icon: "layers" },
    { href: "/profit", label: "MM Performance", icon: "trend" },
    { href: "/assessment-period", label: "Assessment Period", icon: "calendar" },
  ] },
  { title: "Rebalance", items: [
    { href: "/rebalance", label: "Liquidity Optimization", icon: "target" },
    { href: "/rebalance/exposure", label: "Lending Health", icon: "activity" },
    { href: "/depeg", label: "Depeg Monitor", icon: "target" },
  ] },
  { title: "Research", items: [
    { href: "/strategies", label: "Strategies", icon: "search" },
    { href: "/ratings", label: "Ratings", icon: "scale" },
  ] },
  { title: "Operations", items: [
    { href: "/ops/staking", label: "Staking", icon: "coins" },
    { href: "/ops/farming", label: "Farming", icon: "sprout" },
    { href: "/ops/lending", label: "Lending", icon: "bank" },
    { href: "/ops/borrowing", label: "Borrowing", icon: "layers" },
    { href: "/notifications", label: "Notifications", icon: "bell" },
  ] },
  { title: "Thesis", items: [
    { href: "/evaluation", label: "Evaluation", icon: "activity" },
  ] },
];

function NavIcon({ kind }: { kind: NavItem["icon"] }) {
  const paths = {
    gauge: <><path d="M4 14a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><path d="M5 19h14"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></>,
    scale: <><path d="M12 3v18"/><path d="M5 6h14"/><path d="m5 6-3 7h6L5 6Z"/><path d="m19 6-3 7h6l-3-7Z"/><path d="M8 21h8"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    activity: <path d="M3 12h4l2-7 4 14 2-7h6"/>,
    trend: <><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></>,
    coins: <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></>,
    sprout: <><path d="M12 21V10"/><path d="M12 13C8 13 5 10 5 6c4 0 7 2 7 6"/><path d="M12 10c0-4 3-6 7-6 0 4-3 7-7 7"/></>,
    bank: <><path d="m3 10 9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3 20h18"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

function activePath(pathname: string, href: string) {
  return href === "/" || href === "/rebalance" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return <nav className="nav-groups">
    <div className="sidebar-brand"><Image src="/logo.png" alt="DLMM" width={28} height={28}/><strong>DLMM</strong></div>
    {groups.map(group => <section className="nav-group" key={group.title}>
      <p>{group.title}</p>
      {group.items.map(item => <Link key={item.href} href={item.href} onClick={onNavigate} className={activePath(pathname, item.href) ? "active" : ""}>
        <NavIcon kind={item.icon}/><span>{item.label}</span>
      </Link>)}
    </section>)}
  </nav>;
}

export function AppShell({ user, children }: { user: { name: string; email: string; role: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = groups.flatMap(group => group.items).find(item => activePath(pathname, item.href))?.label || "DLMM";

  return <div className="app-shell">
    <aside className="desktop-sidebar"><NavLinks pathname={pathname}/><UserFooter user={user}/></aside>
    {open && <div className="mobile-drawer"><button className="drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)}/><aside><button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close menu">×</button><NavLinks pathname={pathname} onNavigate={() => setOpen(false)}/><UserFooter user={user}/></aside></div>}
    <div className="app-body">
      <header className="app-header">
        <div className="mobile-title"><button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open menu">☰</button><Image src="/logo.png" alt="DLMM" width={24} height={24}/><span>{current}</span></div>
        <div className="header-actions"><ThemeToggle/></div>
      </header>
      <main className="page-scroll"><div className="page-container">{children}</div></main>
    </div>
  </div>;
}

function UserFooter({ user }: { user: { name: string; email: string; role: string } }) {
  return <div className="user-footer"><strong>{user.name}</strong><span>{user.role === "reviewer" ? "Reviewer" : user.role}</span><form action="/api/logout" method="post"><button>Sign out</button></form></div>;
}
