import EmailQueue from '@/components/EmailQueue'
import Sidebar from '@/components/Sidebar'

export default function EmailsPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="page-wrap page-grid">
          <EmailQueue />
        </div>
      </main>
    </div>
  )
}
