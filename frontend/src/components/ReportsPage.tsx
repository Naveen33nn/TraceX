import React, { useState } from 'react'
import { FileText, Download, Printer, Search, Calendar, ShieldCheck, ExternalLink, CheckCircle } from 'lucide-react'

export interface ReportItem {
  id: string
  caseId: string
  title: string
  targetWallet: string
  chain: string
  riskScore: number
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  destinationExchange: string
  date: string
  author: string
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'REP-2026-0091',
    caseId: 'NCRP/2026/09/44812',
    title: 'Telegram Forex Ponzi Multi-Hop Laundering Attribution',
    targetWallet: '0x71C8364...b902',
    chain: 'Ethereum',
    riskScore: 92,
    riskLevel: 'CRITICAL',
    destinationExchange: 'Binance & Tornado Cash',
    date: '2026-09-04',
    author: 'Insp. R. Verma (I4C)',
  },
  {
    id: 'REP-2026-0090',
    caseId: 'NCRP/2026/09/44701',
    title: 'Work-From-Home Task Scam Peeling Analysis',
    targetWallet: '1A1zP1e...8711',
    chain: 'Bitcoin',
    riskScore: 84,
    riskLevel: 'HIGH',
    destinationExchange: 'WazirX Deposit Hub',
    date: '2026-09-03',
    author: 'Sub-Insp. A. Patel',
  },
  {
    id: 'REP-2026-0089',
    caseId: 'NCRP/2026/09/44655',
    title: 'TRC-20 Ransom Extortion & Cross-Chain Hop Trace',
    targetWallet: 'TY18z98...q8a1',
    chain: 'Tron',
    riskScore: 78,
    riskLevel: 'HIGH',
    destinationExchange: 'OKX Off-Ramp',
    date: '2026-09-01',
    author: 'Cyber Cell Cyberabad',
  },
  {
    id: 'REP-2026-0088',
    caseId: 'NCRP/2026/08/43981',
    title: 'Permit Drainer Phishing Contract Cluster Dossier',
    targetWallet: '0x88F93...43A1',
    chain: 'Polygon',
    riskScore: 42,
    riskLevel: 'MEDIUM',
    destinationExchange: 'CoinDCX Staging',
    date: '2026-08-30',
    author: 'Insp. K. Nair',
  },
]

export function ReportsPage({ onTraceWallet }: { onTraceWallet: (wallet: string, chain: string) => void }) {
  const [reports] = useState<ReportItem[]>(INITIAL_REPORTS)
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = (report: ReportItem) => {
    setDownloadingId(report.id)
    setTimeout(() => {
      // Trigger browser print or pdf download
      window.print()
      setDownloadingId(null)
    }, 400)
  }

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.caseId.toLowerCase().includes(search.toLowerCase()) ||
      r.targetWallet.toLowerCase().includes(search.toLowerCase()) ||
      r.destinationExchange.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            <ShieldCheck size={14} /> Evidence Artifacts & Legal Dossiers
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
            Forensic Investigation Reports Archive
          </h2>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search report titles, cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem 0.5rem 2.2rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--surface-card-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            className="glass-panel glass-panel-interactive"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                  {item.caseId}
                </span>
                <span className={`badge ${item.riskLevel === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                  {item.riskLevel} ({item.riskScore})
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                {item.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Suspect Wallet:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{item.targetWallet}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Chain:</span>
                  <span>{item.chain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Destination VASP:</span>
                  <strong style={{ color: 'var(--emerald)' }}>{item.destinationExchange}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Officer / Unit:</span>
                  <span>{item.author}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-card-border)' }}>
              <button
                onClick={() => onTraceWallet(item.targetWallet, item.chain.toLowerCase())}
                className="btn-cyber-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
              >
                Inspect Graph <ExternalLink size={12} />
              </button>
              <button
                onClick={() => handleDownload(item)}
                className="btn-cyber-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
              >
                <Download size={12} /> {downloadingId === item.id ? 'Exporting...' : 'Section 91 PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
