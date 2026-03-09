import Sidebar from '@/components/Sidebar'
import EmailQueue from '@/components/EmailQueue'

export default function EmailsPage() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '48px', minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Email Agent
          </div>
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '48px',
            fontWeight: 300,
            lineHeight: 1.1,
          }}>
            Email Review Queue
          </h1>
        </div>

        <EmailQueue />

      </main>
    </div>
  )
}