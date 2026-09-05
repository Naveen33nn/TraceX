import React, { useState, useEffect } from 'react'
import { Search, ArrowRight, ShieldAlert, Cpu, Activity, Clock, ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { resolveAddress } from '../api'

interface DashboardProps {
  onStartTrace: (address: string, chain: string, crossChain: string) => void
  recentTraces: Array<{
    id: string
    address: string
    chain: string
    risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    score: number
    exchange: string
    time: string
  }>
}

const RISK_DATA = [
  { name: 'Critical', value: 34, color: '#FF3366' },
  { name: 'High', value: 28, color: '#FFB800' },
  { name: 'Medium', value: 22, color: '#00F2FE' },
  { name: 'Low / Clean', value: 16, color: '#00FFA3' },
]

const TOP_EXCHANGES = [
  { name: 'Binance', volume: '142.8 BTC', share: 44 },
  { name: 'WazirX', volume: '88.5 BTC', share: 28 },
  { name: 'OKX', volume: '46.2 BTC', share: 15 },
  { name: 'CoinDCX', volume: '24.1 BTC', share: 8 },
  { name: 'Bybit', volume: '15.4 BTC', share: 5 },
]

export function Dashboard({ onStartTrace, recentTraces }: DashboardProps) {
  const [address, setAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState('auto')
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null)
  const [crossChain, setCrossChain] = useState('All Chains')
  const [isResolving, setIsResolving] = useState(false)

  // Auto-detect chain format as user types
  useEffect(() => {
    const trimmed = address.trim()
    if (!trimmed) {
      setDetectedBadge(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsResolving(true)
      try {
        const res = await resolveAddress(trimmed)
        if (res.valid) {
          setDetectedBadge(res.suggested_chain ? res.suggested_chain.toUpperCase() : 'EVM')
          if (selectedChain === 'auto' && res.suggested_chain) {
            setSelectedChain(res.suggested_chain)
          }
        } else {
          setDetectedBadge(null)
        }
      } catch {
        // Fallback simple regex
        if (trimmed.startsWith('0x') && trimmed.length === 42) setDetectedBadge('EVM / ETH')
        else if (trimmed.startsWith('1') || trimmed.startsWith('3') || trimmed.startsWith('bc1')) setDetectedBadge('BTC')
        else if (trimmed.startsWith('T') && trimmed.length === 34) setDetectedBadge('TRON')
        else setDetectedBadge(null)
      } finally {
        setIsResolving(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [address, selectedChain])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return
    onStartTrace(address.trim(), selectedChain, crossChain)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search Bar - Prominent 56px with Auto-detect */}
      <section className="glass-panel" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
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
              <Zap size={14} /> Unified Multi-Chain Intelligence Engine
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>
              Initiate Fraud Attribution & Fund Hop Trace
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <span>Shortcut:</span>
            <kbd style={{ background: 'var(--surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--surface-card-border)' }}>/</kbd>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(7, 9, 14, 0.85)',
            border: '1px solid var(--surface-card-border)',
            borderRadius: '10px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}>
            <Search size={22} style={{ marginLeft: '1.25rem', color: 'var(--primary)' }} />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Paste Bitcoin (bc1... / 1...), Ethereum / Polygon (0x...), or TRON (T...) suspect address..."
              style={{
                flex: 1,
                height: '56px',
                padding: '0 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                outline: 'none',
              }}
            />

            {detectedBadge && (
              <span className="badge badge-medium" style={{ marginRight: '1rem' }}>
                DETECTED: {detectedBadge}
              </span>
            )}

            {isResolving && (
              <RefreshCw size={18} className="animate-spin" style={{ marginRight: '1rem', color: 'var(--primary)' }} />
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {/* Cryptocurrency dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Network:</span>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="auto">⚡ Auto-Detect Chain</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="tron">TRON (TRX / TRC-20)</option>
                <option value="polygon">Polygon (MATIC)</option>
              </select>
            </div>

            {/* Cross-chain bridge selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cross-Chain Bridge:</span>
              <select
                value={crossChain}
                onChange={(e) => setCrossChain(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--surface-card-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="All Chains">All Bridges & Native Layers</option>
                <option value="Wormhole Bridge">Wormhole Portal</option>
                <option value="Stargate Bridge">Stargate (LayerZero)</option>
                <option value="cBridge">Celer cBridge</option>
                <option value="Hop Protocol">Hop Protocol</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!address.trim()}
              className="btn-cyber-primary"
              style={{ marginLeft: 'auto', height: '42px' }}
            >
              Trace Fund Movement <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>

      {/* 4 Stat Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        <div className="glass-panel glass-panel-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Investigations</span>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', fontFamily: 'var(--font-heading)' }}>
            142
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>↑ 18% from last week</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Identified Exchanges</span>
            <Cpu size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', fontFamily: 'var(--font-heading)' }}>
            38
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
            VASP consensus established
          </div>
        </div>

        <div className="glass-panel glass-panel-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Wallets Flagged (AML)</span>
            <ShieldAlert size={18} style={{ color: 'var(--critical)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', fontFamily: 'var(--font-heading)', color: 'var(--critical)' }}>
            67
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--critical)' }}>
            High-risk / sanctioned clusters
          </div>
        </div>

        <div className="glass-panel glass-panel-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg Attribution Latency</span>
            <Clock size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.5rem 0', fontFamily: 'var(--font-heading)' }}>
            12.3s
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Multi-hop graph traversal
          </div>
        </div>
      </section>

      {/* Analytics Charts: Risk Distribution & Top Exchanges */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Risk Distribution Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Risk Tier Distribution</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Classified addresses across active cases</p>
            </div>
            <span className="badge badge-high">REAL-TIME</span>
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RISK_DATA}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {RISK_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-card-border)', borderRadius: '8px', color: '#FFF' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
            {RISK_DATA.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                <strong className="mono-val">{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Top Exchanges Horizontal Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Top Destination Exchanges</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Identified off-ramp endpoints</p>
            </div>
            <span className="badge badge-medium">VASP CONSENSUS</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_EXCHANGES} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 50]} />
                <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={12} width={70} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-card-border)', borderRadius: '8px', color: '#FFF' }} />
                <Bar dataKey="share" fill="#00F2FE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Traces Table */}
      <section className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Recent Attributed Traces</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Latest victim case queries and forensic findings</p>
          </div>
          <span className="badge badge-low">ENRICHED</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-card-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Investigation ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Target Wallet</th>
                <th style={{ padding: '0.75rem 1rem' }}>Chain</th>
                <th style={{ padding: '0.75rem 1rem' }}>Risk Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Destination Exchange</th>
                <th style={{ padding: '0.75rem 1rem' }}>Analyzed At</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTraces.map((trace) => {
                const badgeClass =
                  trace.risk === 'CRITICAL' ? 'badge-critical' :
                  trace.risk === 'HIGH' ? 'badge-high' :
                  trace.risk === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                return (
                  <tr
                    key={trace.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                      #{trace.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                      {trace.address.slice(0, 10)}...{trace.address.slice(-6)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{trace.chain}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${badgeClass}`}>
                        {trace.risk} ({trace.score})
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {trace.exchange}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {trace.time}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => onStartTrace(trace.address, trace.chain, 'All Chains')}
                        className="btn-cyber-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Inspect <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
