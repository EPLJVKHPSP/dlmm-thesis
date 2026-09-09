import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { loadAppModel } from "@/lib/data-repository";

export default async function NotificationsPage() {
  const model = await loadAppModel();

  return <>
    <PageHeader title="Notifications" description="State changes and review-ready allocation proposals create operator messages."/>
    <Card>
      <SectionTitle title="Telegram preview" detail="Position and allocation alerts"/>
      <div className="telegram">
        <div className="telegram-head"><strong>DLMM Bot</strong><span>OPERATIONS</span></div>
        <div className="messages">{model.notifications.map((notification, index) => <article className={`message ${index ? "out" : ""}`} key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <footer><span>{notification.status} · review only</span><time>{notification.createdAt}</time></footer>
        </article>)}</div>
      </div>
    </Card>
  </>;
}
