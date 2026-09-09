"use client";

import { useState, type FormEvent } from "react";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { DonutChart } from "@/components/charts";
import type { ChartDatum, PositionView } from "@/lib/view-data";

type Column = {
  key: string;
  label: string;
  align?: "right";
  format?: "usd" | "number" | "percent" | "status";
};

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  required?: boolean;
};

const usd = (value: number | string) => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const number = (value: number | string) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 });

function renderValue(row: PositionView, column: Column) {
  const value = row[column.key];
  if (column.format === "usd") return usd(value);
  if (column.format === "number") return number(value);
  if (column.format === "percent") return `${Number(value).toFixed(2)}%`;
  if (column.format === "status") return <Badge tone={String(value).toLowerCase() === "active" ? "good" : "neutral"}>{String(value)}</Badge>;
  return String(value ?? "—");
}

export function PositionWorkbench({
  activity,
  description,
  initialRows,
  columns,
  fields,
  chartTitle,
  chartData,
}: {
  activity: string;
  description: string;
  initialRows: PositionView[];
  columns: Column[];
  fields: Field[];
  chartTitle: string;
  chartData: ChartDatum[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const next: PositionView = {
      id: `${activity.toUpperCase().slice(0, 4)}-${String(rows.length + 1).padStart(3, "0")}`,
      status: "Active",
    };
    for (const field of fields) {
      const raw = data[field.name];
      next[field.name] = field.type === "number" ? Number(raw) : String(raw ?? "");
    }
    setRows((current) => [next, ...current]);
    event.currentTarget.reset();
    setOpen(false);
  }

  return <>
    <PageHeader
      title={activity}
      description={description}
      actions={<button type="button" className="button" onClick={() => setOpen(true)}>Add {activity.toLowerCase()}</button>}
    />

    <div className="grid ops-overview">
      <Card className="ops-chart-card">
        <SectionTitle title={chartTitle} detail="Active positions"/>
        <DonutChart data={chartData}/>
      </Card>
      <Card className="ops-summary-card">
        <SectionTitle title="Position summary" detail={`${rows.length} active record${rows.length === 1 ? "" : "s"}`}/>
        <div className="summary-list">
          <div><span>Activity</span><strong>{activity}</strong></div>
          <div><span>Active records</span><strong>{rows.length}</strong></div>
          <div><span>Largest position</span><strong>{usd(Math.max(...rows.map((row) => Number(row.total ?? 0))))}</strong></div>
          <div><span>Data state</span><strong>Review snapshot</strong></div>
        </div>
      </Card>
    </div>

    <div className="spacer"/>
    <Card>
      <SectionTitle title={`Active ${activity.toLowerCase()} positions`} detail="Position lifecycle and performance fields"/>
      <div className="table-wrap">
        <table className="data-table ops-table">
          <thead><tr>{columns.map((column) => <th key={column.key} className={column.align === "right" ? "align-right" : ""}>{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key} className={column.align === "right" ? "align-right" : ""}>{renderValue(row, column)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Card>

    {open && <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="position-form-title">
        <div className="modal-head"><div><h2 id="position-form-title">Add {activity.toLowerCase()}</h2><p>Create a position record</p></div><button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
        <form onSubmit={submit}>
          <div className="form-grid">{fields.map((field) => <label key={field.name}><span>{field.label}</span><input name={field.name} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} placeholder={field.placeholder} required={field.required}/></label>)}</div>
          <div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="button">Create position</button></div>
        </form>
      </section>
    </div>}
  </>;
}
