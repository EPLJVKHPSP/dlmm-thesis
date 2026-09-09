export function PageHeader({ title, description, eyebrow, actions }: { title: string; description?: string; eyebrow?: string; actions?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Metric({ label, value, detail, tone = "plain" }: { label: string; value: string; detail: string; tone?: string }) {
  return <Card className={`metric metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{detail}</span></Card>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return <div className="section-title"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div></div>;
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: string }) {
  return <div className="progress"><span className={`progress-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
