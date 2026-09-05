import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, CheckCheck, Filter, ShieldAlert, ArrowRight, Volume2 } from 'lucide-react'

export interface AlertItem {
  id: string
  timestamp: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  chain: string
  wallet: string
  txHash?: string
  read: boolean
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-1092',
    timestamp: 'Just now',
    severity: 'CRITICAL',
    title: 'Sanctioned Mixer Fund Drainage Detected',
    description: '14.5 ETH transferred from Tornado Cash to cluster associated with Case #NCRP/2026/09/44812.',
    chain: 'Ethereum',
    wallet: '0x28C6...16e2',
    txHash: '0x9a8f...3e12',
    read: false,
  },
  {
    id: 'ALT-1091',
    timestamp: '4 mins ago',
    severity: 'CRITICAL',
    title: 'High-Volume USDT Rapid Fan-Out',
    description: '180,000 USDT dispersed across 12 newly created TRON wallets within 60 seconds.',
    chain: 'Tron',
    wallet: 'TY18z...q8a1',
    txHash: 'f48b...19ae',
    read: false,
  },
  {
    id: 'ALT-1090',
    timestamp: '18 mins ago',
    severity: 'WARNING',
    title: 'Exchange Deposit Hop Flag',
    description: 'Suspect funds reached Binance deposit wallet with high confidence (98%).',
    chain: 'Bitcoin',
    wallet: '1A1zP...8711',
    read: false,
  },
  {
    id: 'ALT-1089',
    timestamp: '1 hour ago',
    severity: 'INFO',
    title: 'Cross-Chain Wormhole Bridge Transfer',
    description: 'Asset bridged from Polygon to Ethereum mainnet via Portal bridge.',
    chain: 'Polygon',
    wallet: '0x88F...43A1',
    read: true,
  },
  {
    id: 'ALT-1088',
    timestamp: '3 hours ago',
    severity: 'WARNING',
    title: 'Peel Chain Structuring Detected',
    description: 'Repeated transactions of 4,990 USDT observed below AML reporting limits.',
    chain: 'Ethereum',
    wallet: '0x71C...b902',
    read: true,
  },
]

export function AlertsPage({ onTraceWallet }: { onTraceWallet: (wallet: string, chain: string) => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS)
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL')

  const markAllRead = () => {
    setAlerts(alerts.map((a) => ({ ...a, read: true })))
  }

  const toggleRead = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: !a.read } : a)))
  }

  const filtered = alerts.filter((a) => {
    if (filter === 'ALL') return true
    return a.severity === filter
  })

  const getSeverityStyle = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          borderLeft: '4px solid var(--critical)',
          bg: 'rgba(255, 51, 102, 0.08)',
          icon: <AlertCircle size={20} color="var(--critical)" />,
          badge: <span className="badge badge-critical">CRITICAL THREAT</span>,
        }
      case 'WARNING':
        return {
          borderLeft: '4px solid var(--amber)',
          bg: 'rgba(255, 184, 0, 0.08)',
          icon: <AlertTriangle size={20} color="var(--amber)" />,
          badge: <span className="badge badge-high">SUSPICIOUS HOPS</span>,
        }
      case 'INFO':
        return {
          borderLeft: '4px solid var(--primary)',
          bg: 'rgba(0, 242, 254, 0.08)',
          icon: <Info size={20} color="var(--primary)" />,
          badge: <span className="badge badge-medium">BRIDGE TELEMETRY</span>,
        }
    }
  }

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
            <ShieldAlert size={14} /> Real-Time Cyber Crime Telemetry Stream
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
            Live Fraud Surveillance Feed
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={markAllRead} className="btn-cyber-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--surface-card-border)', paddingBottom: '0.75rem' }}>
        {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: filter === tab ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: filter === tab ? 'var(--surface-hover)' : 'transparent',
              color: filter === tab ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((item) => {
          const style = getSeverityStyle(item.severity)
          return (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderLeft: style.borderLeft,
                backgroundColor: item.read ? 'var(--surface-card)' : style.bg,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div style={{ marginTop: '0.2rem' }}>{style.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    {style.badge}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                    <span className="badge" style={{ backgroundColor: 'var(--surface)', fontSize: '0.65rem' }}>
                      {item.chain}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Target: <span style={{ color: 'var(--primary)' }}>{item.wallet}</span>
                    </span>
                    {item.txHash && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Tx: <span style={{ color: 'var(--text-secondary)' }}>{item.txHash}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => toggleRead(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--surface-card-border)',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {item.read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => onTraceWallet(item.wallet, item.chain.toLowerCase())}
                  className="btn-cyber-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Trace Address <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
