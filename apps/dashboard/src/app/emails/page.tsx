import EmailQueue from '@/components/EmailQueue'
import Sidebar from '@/components/Sidebar'

export default function EmailsPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="page-wrap page-grid">
          <section className="page-hero">
            <div className="eyebrow">Email Agent</div>
            <h1 className="page-title">
              Review queue,
              <br />
              <em>without the clutter</em>
            </h1>
          </section>

          <EmailQueue />
        </div>
      </main>
    </div>
  )
}
