"use client";

import { useState } from "react";

export type GuidelineAction = {
  leg: string;
  action: "exit" | "enter";
  label: string;
  platform: string;
  usd: number;
};

export function GuidelineChecklist({ actions }: { actions: GuidelineAction[] }) {
  const [done, setDone] = useState<string[]>([]);
  const toggle = (key: string) => setDone((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  return <>
    <p className="subtle">{done.length} of {actions.length} steps confirmed by a human. Nothing here constructs or submits a transaction.</p>
    <div className="spacer"/>
    <div className="table-wrap"><table className="data-table"><thead><tr><th></th><th>Leg</th><th>Action</th><th>Label</th><th>Platform</th><th className="align-right">USD</th></tr></thead><tbody>
      {actions.map((a, i) => {
        const key = `${a.action}-${a.label}-${i}`;
        const checked = done.includes(key);
        return <tr key={key}>
          <td><input type="checkbox" checked={checked} onChange={() => toggle(key)} aria-label={`Confirm ${a.action} ${a.label}`}/></td>
          <td>{a.leg}</td><td>{a.action}</td><td><strong>{a.label}</strong></td><td>{a.platform}</td>
          <td className="align-right">${a.usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
        </tr>;
      })}
    </tbody></table></div>
  </>;
}
