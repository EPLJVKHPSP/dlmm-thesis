"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/lib/view-data";

type Tokens = {
  palette: string[];
  foreground: string;
  muted: string;
  surface: string;
  border: string;
  borrowing: string;
};

const FALLBACK: Tokens = {
  palette: ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
  foreground: "#18181b",
  muted: "#71717a",
  surface: "#ffffff",
  border: "#e4e4e7",
  borrowing: "#c2410c",
};

function readTokens(): Tokens {
  if (typeof window === "undefined") return FALLBACK;
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    palette: [1, 2, 3, 4, 5, 6].map((index) => token(`--chart-${index}`, FALLBACK.palette[index - 1])),
    foreground: token("--foreground", FALLBACK.foreground),
    muted: token("--muted", FALLBACK.muted),
    surface: token("--surface", FALLBACK.surface),
    border: token("--border", FALLBACK.border),
    borrowing: token("--chart-borrow", FALLBACK.borrowing),
  };
}

function useTokens() {
  const [tokens, setTokens] = useState(FALLBACK);
  useEffect(() => {
    const refresh = () => setTokens(readTokens());
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

const compactUsd = (value: number) => {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 1_000_000_000) return `${sign}$${(absolute / 1_000_000_000).toFixed(absolute % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(absolute % 1_000_000 === 0 ? 0 : 1)}M`;
  if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(absolute % 1_000 === 0 ? 0 : 1)}K`;
  return `${sign}$${absolute.toFixed(0)}`;
};

const fullUsd = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(value);

export function DonutChart({
  data,
  size = "default",
  legend = true,
}: {
  data: ChartDatum[];
  size?: "default" | "large";
  legend?: boolean;
}) {
  const tokens = useTokens();
  const total = data.reduce((sum, row) => sum + Math.abs(row.value), 0);
  const height = size === "large" ? 340 : 260;
  const outerRadius = size === "large" ? 122 : 88;
  const innerRadius = size === "large" ? 73 : 53;
  const color = (row: ChartDatum, index: number) => row.tone === "borrowing" ? tokens.borrowing : tokens.palette[index % tokens.palette.length];

  return <div className={`donut-layout ${size === "large" ? "donut-large" : ""}`}>
    <div className="donut-canvas" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: height, height }}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((row, index) => <Cell key={row.label} fill={color(row, index)}/>) }
            <Label content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={tokens.foreground} fontSize={size === "large" ? 22 : 17} fontWeight={650}>{compactUsd(total)}</text>;
            }}/>
          </Pie>
          <Tooltip formatter={(value) => fullUsd(Number(value))} contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.foreground, fontSize: 12 }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
    {legend && <ul className="donut-legend">{data.map((row, index) => <li key={row.label}>
      <span className="legend-dot" style={{ background: color(row, index) }}/>
      <span className="legend-name">{row.label}</span>
      <strong>{fullUsd(row.value)}</strong>
      <small>{total ? `${(row.value / total * 100).toFixed(1)}%` : "0%"}</small>
    </li>)}</ul>}
  </div>;
}

export function NavLineChart({ data }: { data: { period: string; nav: number; invested: number }[] }) {
  const tokens = useTokens();
  return <div className="line-chart">
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 720, height: 260 }}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" vertical={false}/>
        <XAxis dataKey="period" tick={{ fill: tokens.muted, fontSize: 11 }} axisLine={false} tickLine={false}/>
        <YAxis tickFormatter={compactUsd} tick={{ fill: tokens.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={62}/>
        <Tooltip formatter={(value) => fullUsd(Number(value))} contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.foreground, fontSize: 12 }}/>
        <Legend wrapperStyle={{ fontSize: 12, color: tokens.muted }}/>
        <Line type="monotone" dataKey="nav" name="NAV" stroke={tokens.palette[0]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false}/>
        <Line type="monotone" dataKey="invested" name="Invested" stroke={tokens.palette[2]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false}/>
      </RechartsLineChart>
    </ResponsiveContainer>
  </div>;
}

export type LendingHealthData = {
  borrowed: number;
  openPositionLimit: number;
  policyLimit: number;
  liquidationThreshold: number;
  collateral: number;
};

export function LendingHealthRuler({ data, compact = false }: { data: LendingHealthData; compact?: boolean }) {
  const max = data.collateral;
  const pct = (value: number) => `${Math.min(100, Math.max(0, value / max * 100))}%`;
  return <div className={`health-ruler ${compact ? "health-compact" : ""}`}>
    <div className="health-summary">
      <div><span>Borrowed</span><strong>{compactUsd(data.borrowed)}</strong></div>
      <div><span>Available headroom</span><strong>{compactUsd(Math.max(0, data.openPositionLimit - data.borrowed))}</strong></div>
      <div><span>Collateral</span><strong>{compactUsd(data.collateral)}</strong></div>
    </div>
    <div className="health-track-wrap">
      <div className="health-zones"><span className="zone-safe" style={{ width: pct(data.openPositionLimit) }}/><span className="zone-watch" style={{ width: `calc(${pct(data.policyLimit)} - ${pct(data.openPositionLimit)})` }}/><span className="zone-danger"/></div>
      <span className="health-fill" style={{ width: pct(data.borrowed) }}/>
      <span className="health-marker marker-open" style={{ left: pct(data.openPositionLimit) }}/>
      <span className="health-marker marker-limit" style={{ left: pct(data.policyLimit) }}/>
      <span className="health-marker marker-liquidation" style={{ left: pct(data.liquidationThreshold) }}/>
    </div>
    <div className="health-scale"><span>$0</span><span>{compactUsd(max)}</span></div>
    <div className="health-key">
      <span><i className="key-borrowed"/>Borrowed {compactUsd(data.borrowed)}</span>
      <span><i className="key-open"/>Open position {compactUsd(data.openPositionLimit)}</span>
      <span><i className="key-limit"/>Policy limit {compactUsd(data.policyLimit)}</span>
      <span><i className="key-liquidation"/>Liquidation {compactUsd(data.liquidationThreshold)}</span>
    </div>
  </div>;
}
