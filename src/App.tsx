import { useState } from 'react'
import { FileText, Users } from 'lucide-react'
import { InvoiceEditor } from './views/InvoiceEditor'
import { ClientsView } from './views/ClientsView'
import type { Client } from './types'

type View = 'facture' | 'clients'

export default function App() {
  const [view, setView] = useState<View>('facture')
  const [selectedClient, setSelectedClient] = useState<Omit<Client, 'id'> | null>(null)

  const handleLoadClient = (client: Omit<Client, 'id'>) => {
    setSelectedClient(client)
    setView('facture')
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ minWidth: '1024px' }}>
      {/* Navigation latérale */}
      <nav className="w-16 bg-slate-800 flex flex-col items-center py-4 gap-1 flex-shrink-0">
        <div className="mb-4 mt-1">
          <FileText size={20} className="text-slate-400" />
        </div>
        <NavItem
          icon={<FileText size={18} />}
          label="Facture"
          active={view === 'facture'}
          onClick={() => setView('facture')}
        />
        <NavItem
          icon={<Users size={18} />}
          label="Clients"
          active={view === 'clients'}
          onClick={() => setView('clients')}
        />
      </nav>

      {/* Contenu principal */}
      <main className="flex-1 flex overflow-hidden">
        {view === 'facture' ? (
          <InvoiceEditor preloadedClient={selectedClient} />
        ) : (
          <ClientsView onLoadClient={handleLoadClient} />
        )}
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${active ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
      title={label}
    >
      {icon}
      <span className="text-[9px] font-medium tracking-wide uppercase">{label}</span>
    </button>
  )
}
