import React, { useState } from 'react'
import { PlusCircle, Search, FileText, AlertTriangle, CheckCircle2, Clock, ShieldCheck, ChevronRight } from 'lucide-react'

export interface Complaint {
  id: string
  referenceId: string
  victimName: string
  walletAddress: string
  chain: string
  crimeType: string
  reportedAmount: string
  currency: string
  reportedDate: string
  status: 'PENDING' | 'TRACING' | 'RESOLVED' | 'ESCALATED'
  notes?: string
}

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'CMP-2026-891',
    referenceId: 'NCRP/2026/09/44812',
    victimName: 'Rahul Sharma',
    walletAddress: '0x71C...b902',
    chain: 'Ethereum',
    crimeType: 'Investment Scam',
    reportedAmount: '45,000',
    currency: 'USDT',
    reportedDate: '2026-09-04',
    status: 'TRACING',
    notes: 'Telegram crypto trading group scheme. Promised 20% weekly ROI.',
  },
  {
    id: 'CMP-2026-890',
    referenceId: 'NCRP/2026/09/44701',
    victimName: 'Ananya Verma',
    walletAddress: '1A1zP...8711',
    chain: 'Bitcoin',
    crimeType: 'Task Fraud',
    reportedAmount: '0.85',
    currency: 'BTC',
    reportedDate: '2026-09-03',
    status: 'ESCALATED',
    notes: 'YouTube review task fraud where funds were locked in deceptive escrow.',
  },
  {
    id: 'CMP-2026-889',
    referenceId: 'NCRP/2026/09/44655',
    victimName: 'Vikram Patel',
    walletAddress: 'TY18z...q8a1',
    chain: 'Tron',
    crimeType: 'Sextortion',
    reportedAmount: '8,500',
    currency: 'TRX',
    reportedDate: '2026-09-01',
    status: 'RESOLVED',
    notes: 'Blackmail extortion threat. Attributed to Binance deposit account.',
  },
  {
    id: 'CMP-2026-888',
    referenceId: 'NCRP/2026/08/43981',
    victimName: 'Siddharth Rao',
    walletAddress: '0x88F...43A1',
    chain: 'Polygon',
    crimeType: 'Phishing',
    reportedAmount: '12,000',
    currency: 'MATIC',
    reportedDate: '2026-08-30',
    status: 'PENDING',
    notes: 'Fake airdrop permit approval drainer contract.',
  },
]

export function ComplaintsPage({ onTraceAddress }: { onTraceAddress: (address: string, chain: string) => void }) {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS)
  const [search, setSearch] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(complaints[0])

  // New Complaint Form
  const [wallet, setWallet] = useState('')
  const [chain, setChain] = useState('ethereum')
  const [victimName, setVictimName] = useState('')
  const [refId, setRefId] = useState(`NCRP/2026/09/${Math.floor(10000 + Math.random() * 90000)}`)
  const [crimeType, setCrimeType] = useState('Investment Scam')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet.trim()) return

    const newEntry: Complaint = {
      id: `CMP-2026-${Math.floor(900 + Math.random() * 100)}`,
      referenceId: refId,
      victimName: victimName || 'Anonymous Citizen',
      walletAddress: wallet.trim(),
      chain: chain.charAt(0).toUpperCase() + chain.slice(1),
      crimeType,
      reportedAmount: amount || '0',
      currency: chain === 'bitcoin' ? 'BTC' : chain === 'tron' ? 'TRX' : 'USDT',
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      notes,
    }

    setComplaints([newEntry, ...complaints])
    setSelectedComplaint(newEntry)
    setWallet('')
    setAmount('')
    setNotes('')
    setVictimName('')
    setRefId(`NCRP/2026/09/${Math.floor(10000 + Math.random() * 90000)}`)
    setSuccessMsg('Complaint registered into National Cyber Crime Database!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const filtered = complaints.filter(
    (c) =>
      c.victimName.toLowerCase().includes(search.toLowerCase()) ||
      c.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      c.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
      c.crimeType.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-high"><Clock size={12} /> Pending</span>
      case 'TRACING':
        return <span className="badge badge-medium"><AlertTriangle size={12} /> Tracing</span>
      case 'RESOLVED':
        return <span className="badge badge-low"><CheckCircle2 size={12} /> Resolved</span>
      case 'ESCALATED':
        return <span className="badge badge-critical"><ShieldCheck size={12} /> Escalated</span>
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
          <FileText size={14} /> National Cyber Crime Reporting Portal (NCRP)
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
          Victim Complaint Case Registry & Evidence Intake
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Left Form: Complaint Registration */}
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} color="var(--primary)" /> Register Incident Complaint
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Enter victim loss details to instantly cross-index against blockchain evidence
          </p>

          {successMsg && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(0, 255, 163, 0.15)',
              border: '1px solid rgba(0, 255, 163, 0.3)',
              borderRadius: '8px',
              color: 'var(--emerald)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                NCRP Reference ID
              </label>
              <input
                type="text"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Victim Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Crime Category
                </label>
                <select
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="Investment Scam">Investment Scam</option>
                  <option value="Task Fraud">Task Fraud / Part-Time Job</option>
                  <option value="Sextortion">Sextortion / Blackmail</option>
                  <option value="Ransomware">Ransomware Demand</option>
                  <option value="Phishing">Phishing / Drainer Permit</option>
                  <option value="Darknet">Darknet Market Drug/Weapon</option>
                  <option value="Organized Crime">Hawala & Organized Crime</option>
                  <option value="Other">Other Cyber Threat</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Suspect Crypto Wallet Address *
              </label>
              <input
                type="text"
                required
                placeholder="Paste destination wallet address where funds were sent..."
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Target Blockchain
                </label>
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ethereum">Ethereum (ETH / ERC-20)</option>
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="tron">TRON (TRX / TRC-20)</option>
                  <option value="polygon">Polygon (MATIC)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Reported Loss Amount
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5,000 USDT"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Case Notes / Modus Operandi
              </label>
              <textarea
                rows={3}
                placeholder="Telegram handles, phone numbers, phishing URLs used..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  resize: 'none',
                }}
              />
            </div>

            <button type="submit" className="btn-cyber-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
              Submit NCRP Complaint Dossier
            </button>
          </form>
        </section>

        {/* Right Section: Search & Complaint History Table */}
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Active Case Log</h3>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter by ref, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem 0.4rem 2rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedComplaint(item)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: selectedComplaint?.id === item.id ? 'var(--surface-hover)' : 'var(--surface)',
                  border: selectedComplaint?.id === item.id ? '1px solid var(--primary)' : '1px solid var(--surface-card-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                    {item.referenceId}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.victimName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.crimeType}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono-val" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {item.reportedAmount} {item.currency}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.reportedDate}</span>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--surface-card-border)' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.walletAddress.slice(0, 10)}...{item.walletAddress.slice(-6)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTraceAddress(item.walletAddress, item.chain.toLowerCase())
                    }}
                    className="btn-cyber-primary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                  >
                    Trace Wallet <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
