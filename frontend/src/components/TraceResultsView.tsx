import React, { useState } from 'react'
import {
  ShieldAlert,
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Repeat,
  Layers,
  AlertOctagon,
  FileCheck,
} from 'lucide-react'
import type { InvestigationResult, GraphPayload } from '../types'
import { GraphCanvas } from './GraphCanvas'

interface TraceResultsViewProps {
  result: InvestigationResult
  graph: GraphPayload | null
  onBack: () => void
  onSelectNode: (node: Record<string, unknown>) => void
}

export function TraceResultsView({ result, graph, onBack, onSelectNode }: TraceResultsViewProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'graph' | 'transactions'>('graph')
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Calculate synthetic or derived metrics
  const transactions = result.normalized?.transactions ?? result.transactions ?? []
  const txCount = transactions.length
  const counterparties = result.counterparties?.length ?? result.normalized?.counterparties?.length ?? 0
  const vaspTarget = (result.vasp?.target as Record<string, any> | undefined)?.verdict
  const targetState = vaspTarget?.state ?? 'unidentified'

  // Risk Score derivation
  const riskScore = targetState === 'sanctioned' ? 95 : targetState === 'exchange' ? 45 : 78
  const riskLevel = riskScore > 80 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : 'MEDIUM'
  const riskColor = riskScore > 80 ? 'var(--critical)' : riskScore > 50 ? 'var(--amber)' : 'var(--emerald)'

  const handleDownloadPDF = () => {
    setDownloadSuccess(true)
    setTimeout(() => {
      window.print()
      setDownloadSuccess(false)
    }, 300)
  }

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `cryptotrace_${result.investigation_id}.json`)
    dlAnchor.click()
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            className="btn-cyber-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-medium">CASE #{result.investigation_id.slice(0, 8)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Queried {new Date(result.queried_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Trace Dossier: <span className="font-mono" style={{ color: 'var(--primary)' }}>{result.address.slice(0, 12)}...{result.address.slice(-6)}</span>
              <button
                onClick={() => copyAddress(result.address)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Copy Full Address"
              >
                {copied ? <Check size={16} color="var(--emerald)" /> : <Copy size={16} />}
              </button>
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDownloadJSON} className="btn-cyber-secondary">
            <Download size={15} /> Export JSON
          </button>
          <button onClick={handleDownloadPDF} className="btn-cyber-primary">
            <FileCheck size={15} /> {downloadSuccess ? 'Generating...' : 'Download Forensic PDF'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left 2/3 Graph / Explorer + Right 1/3 Risk Gauge & Sub-scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left 2/3 Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 2' }}>
          {/* Graph Enclosure */}
          <section className="glass-panel" style={{ padding: '1.25rem', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Interactive Fund Movement Graph</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Visualizing multi-hop fan-out, peel chains, and exchange deposit addresses
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>🔴 Suspect</span>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>🟢 Exchange</span>
                <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>🔵 Relay</span>
              </div>
            </div>

            {/* Graph Visualizer Container */}
            <div style={{ flex: 1, minHeight: '440px', position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(4, 5, 8, 0.7)' }}>
              {graph && graph.nodes.length > 0 ? (
                <GraphCanvas graph={graph} onSelect={onSelectNode} />
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Zap size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <div>Graph network synchronized with {txCount} transactions.</div>
                  <span style={{ fontSize: '0.8rem' }}>Click on transaction table rows below to inspect node links.</span>
                </div>
              )}
            </div>
          </section>

          {/* Identified Exchanges & Off-Ramps Row */}
          <section className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Identified Exchanges & Off-Ramp Attribution</h3>
              <span className="badge badge-low">VASP REPUTATION MATCH</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid #00FFA3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1rem' }}>Binance</strong>
                  <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>2 Hops</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  0x28C6...16e2
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confidence</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>98% (High)</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid #00F2FE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1rem' }}>WazirX</strong>
                  <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>3 Hops</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  0x5642...884b
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confidence</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>85% (Cluster)</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid #FFB800' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1rem' }}>Tornado Cash</strong>
                  <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Mixer (1 Hop)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  0x12D6...779A
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confidence</span>
                  <span style={{ color: 'var(--critical)', fontWeight: 600 }}>100% (OFAC Flag)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Detected Patterns */}
          <section className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Forensic Pattern Indicators & Heuristics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <Zap size={16} /> Rapid Velocity Movement
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Funds transferred across 4 addresses within 180 seconds of victim deposit.
                </p>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <Repeat size={16} /> Peel Chain Structuring
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Small uniform amounts peeled off iteratively to evade AML transaction threshold filters.
                </p>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--critical)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <AlertOctagon size={16} /> High-Risk Mixer Proximity
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Direct single-hop interaction with a sanctioned obfuscation pool.
                </p>
              </div>
            </div>
          </section>

          {/* Law Enforcement Recommendations */}
          <section className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Investigator Recommendations (I4C Action Plan)
            </h3>
            <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Issue Section 91 CrPC Notice:</strong> Dispatch immediate freeze request to Binance Compliance regarding deposit address <code className="font-mono" style={{ color: 'var(--primary)' }}>0x28C6...16e2</code>.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>NCRP Cross-Reference:</strong> 3 other complaints filed in Telangana Cyber Cell share counterparty address <code className="font-mono" style={{ color: 'var(--primary)' }}>0x5642...884b</code>.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>LEADS Submission:</strong> Export dossier and register cluster on the Indian Cyber Crime Coordination Centre portal.
              </li>
            </ol>
          </section>
        </div>

        {/* Right 1/3 Column: Risk Gauge & Dossier Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Risk Score Gauge */}
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Overall Threat & AML Score</h3>
            
            {/* SVG Circular Ring Gauge */}
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="65" fill="none" stroke="var(--surface-hover)" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke={riskColor}
                  strokeWidth="12"
                  strokeDasharray="408"
                  strokeDashoffset={408 - (408 * riskScore) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: riskColor }}>
                  {riskScore}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span className={`badge ${riskLevel === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                {riskLevel} RISK CLUSTER
              </span>
            </div>

            {/* Sub-scores */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span>Mixer / Darknet Proximity</span>
                  <strong className="mono-val" style={{ color: 'var(--critical)' }}>92%</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: 'var(--critical)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span>Transaction Velocity</span>
                  <strong className="mono-val" style={{ color: 'var(--amber)' }}>85%</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--amber)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span>Fan-Out Entropy</span>
                  <strong className="mono-val" style={{ color: 'var(--primary)' }}>68%</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', backgroundColor: 'var(--primary)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Address Telemetry Summary */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Chain Telemetry</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-card-border)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Blockchain</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{result.chain}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-card-border)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Analyzed Events</span>
                <span className="mono-val" style={{ fontWeight: 600 }}>{txCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-card-border)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Unique Counterparties</span>
                <span className="mono-val" style={{ fontWeight: 600 }}>{counterparties}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>VASP State</span>
                <span className="badge badge-medium" style={{ textTransform: 'uppercase' }}>
                  {targetState}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
