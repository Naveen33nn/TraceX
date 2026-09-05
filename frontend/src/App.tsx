import { useEffect, useMemo, useState } from 'react'
import { graphStatus, investigate, loadGraph } from './api'
import { DetailPanel } from './components/DetailPanel'
import { FilterBar, type Filters } from './components/FilterBar'
import { GraphCanvas } from './components/GraphCanvas'
import { TransactionTable } from './components/TransactionTable'
import { Timeline } from './components/Timeline'
import { filterTransactions } from './filtering'
import type { GraphPayload, InvestigationInput, InvestigationResult, Transaction } from './types'
import './styles.css'

const initialInput: InvestigationInput = { address: '', chain: 'auto', case_id: '', complaint_id: '', fraud_type: 'Investment fraud', reported_amount: '', reported_at: '', victim_reference: '', include_vasp: true, include_raw: true, force_refresh: false }
const initialFilters: Filters = { direction: '', asset: '', provider: '', transactionType: '', query: '', minAmount: '', startDate: '', endDate: '', hopLevel: '', vaspState: '', showTransactions: true }

function useful(value: unknown) { return value === undefined || value === null || value === '' ? '-' : String(value) }

export default function App() {
  const [input, setInput] = useState(initialInput)
  const [result, setResult] = useState<InvestigationResult | null>(null)
  const [graph, setGraph] = useState<GraphPayload | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [message, setMessage] = useState('Ready for a victim-reported wallet.')
  const [busy, setBusy] = useState(false)
  const [neo4j, setNeo4j] = useState('checking')

  useEffect(() => { graphStatus().then((data) => setNeo4j(String(data.status ?? 'unknown'))).catch(() => setNeo4j('offline')) }, [])

  const allTransactions = result?.normalized?.transactions ?? result?.transactions ?? []
  const filteredTransactions = useMemo(() => filterTransactions(allTransactions, filters), [allTransactions, filters])

  const filteredGraph = useMemo(() => {
    if (!graph) return null
    if (!allTransactions.length || (filteredTransactions.length === allTransactions.length && filters.showTransactions)) return graph
    const ids = new Set(filteredTransactions.flatMap((row) => [row.tx_hash, row.event_id]).filter(Boolean).map(String))
    const nodeKey = (node: Record<string, unknown>) => String(node.identity ?? node.id ?? '')
    const endpointKey = (value: string) => {
      const match = graph.nodes.find((node) => node.identity === value || node.id === value || `address:${node.address}` === value || `tx:${node.tx_hash}` === value)
      return match ? nodeKey(match as Record<string, unknown>) : value
    }
    const txNodes = new Set(graph.nodes.filter((node) => String(node.type).toLowerCase() === 'transaction' && ids.has(String(node.tx_hash ?? node.event_id ?? ''))).map((node) => nodeKey(node as Record<string, unknown>)))
    const visible = filters.showTransactions ? new Set(txNodes) : new Set<string>()
    graph.edges.forEach((edge) => {
      const source = endpointKey(edge.source)
      const target = endpointKey(edge.target)
      if (visible.has(source) || visible.has(target)) { visible.add(source); visible.add(target) }
    })
    const nodes = graph.nodes.filter((node) => visible.has(nodeKey(node as Record<string, unknown>)) || (filters.showTransactions && String(node.type).toLowerCase() !== 'transaction'))
    const nodeIds = new Set(nodes.map((node) => nodeKey(node as Record<string, unknown>)))
    const edges = graph.edges.filter((edge) => nodeIds.has(endpointKey(edge.source)) && nodeIds.has(endpointKey(edge.target)))
    return { ...graph, nodes, edges }
  }, [graph, allTransactions.length, filteredTransactions, filters.showTransactions])

  async function run() {
    if (!input.address.trim()) { setMessage('Enter a wallet address before starting.'); return }
    setBusy(true); setMessage('Collecting, normalizing, and syncing the graph...'); setSelected(null)
    try {
      const data = await investigate({ ...input, address: input.address.trim() })
      setResult(data); setFilters(initialFilters); setGraph(data.graph ?? null)
      if (data.investigation_id) {
        const neoGraph = await loadGraph(data.investigation_id).catch(() => null)
        if (neoGraph?.status === 'ok') { setGraph(neoGraph); setNeo4j('ok') }
      }
      const syncStatus = String(data.graph_sync?.status ?? 'unknown')
      setMessage(`Investigation ${data.investigation_id} complete. Graph sync: ${syncStatus}.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Investigation failed.') }
    finally { setBusy(false) }
  }

  const vaspState = String((result?.vasp?.target as Record<string, any> | undefined)?.verdict?.state ?? 'unidentified')
  const graphCount = graph?.node_count ?? graph?.nodes.length ?? 0
  return <main className="app-shell">
    <header className="topbar"><div><div className="eyebrow">SIH26183 / I4C investigation workspace</div><h1>Traceboard</h1><p>Turn a reported wallet into evidence-backed transaction intelligence.</p></div><div className={`connection ${neo4j === 'ok' ? 'online' : ''}`}><span className="dot" /> Neo4j {neo4j}</div></header>
    <section className="intake panel"><div className="section-title"><div><div className="eyebrow">Case intake</div><h2>Start with a reported wallet</h2></div><span className="status-chip">Collector preserved / graph added</span></div>
      <div className="form-grid"><label>Wallet address<input value={input.address} onChange={(event) => setInput({ ...input, address: event.target.value })} placeholder="Paste a Bitcoin, EVM, or TRON address" /></label><label>Chain<select value={input.chain} onChange={(event) => setInput({ ...input, chain: event.target.value })}><option value="auto">Auto detect</option><option value="bitcoin">Bitcoin</option><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="tron">TRON</option></select></label><label>Case ID<input value={input.case_id} onChange={(event) => setInput({ ...input, case_id: event.target.value })} placeholder="Optional" /></label><label>Complaint ID<input value={input.complaint_id} onChange={(event) => setInput({ ...input, complaint_id: event.target.value })} placeholder="NCRP reference" /></label><label>Fraud type<input value={input.fraud_type} onChange={(event) => setInput({ ...input, fraud_type: event.target.value })} placeholder="Investment fraud" /></label><label>Reported amount<input value={input.reported_amount} onChange={(event) => setInput({ ...input, reported_amount: event.target.value })} placeholder="Optional" /></label></div>
      <div className="form-actions"><label className="check"><input type="checkbox" checked={input.include_vasp} onChange={(event) => setInput({ ...input, include_vasp: event.target.checked })} /> Compare VASP providers</label><label className="check"><input type="checkbox" checked={input.include_raw} onChange={(event) => setInput({ ...input, include_raw: event.target.checked })} /> Preserve raw snapshot</label><button onClick={run} disabled={busy}>{busy ? 'Working...' : 'Run investigation'}</button></div><div className="message">{message}</div>
    </section>
    {result && <><section className="metrics"><div className="metric"><span>Transactions</span><strong>{allTransactions.length}</strong></div><div className="metric"><span>Counterparties</span><strong>{result.counterparties?.length ?? result.normalized?.counterparties?.length ?? 0}</strong></div><div className="metric"><span>VASP state</span><strong className={`state-${vaspState}`}>{vaspState}</strong></div><div className="metric"><span>Graph nodes</span><strong>{graphCount}</strong></div></section><section className="workspace"><div className="panel graph-panel"><div className="section-title"><div><div className="eyebrow">Graph view</div><h2>Fund movement network</h2></div><span className="muted">{filteredTransactions.length} filtered events</span></div>{filteredGraph ? <GraphCanvas graph={filteredGraph} onSelect={setSelected} /> : <div className="empty-panel">Neo4j has not returned graph data yet.</div>}</div><aside className="panel inspector"><DetailPanel selected={selected} /></aside></section><section className="panel"><div className="section-title"><div><div className="eyebrow">Local analysis filters</div><h2>Explore the loaded evidence</h2></div><span className="muted">Filtering stays in React</span></div><FilterBar transactions={allTransactions} value={filters} onChange={setFilters} /><TransactionTable rows={filteredTransactions} onSelect={(row) => setSelected(row as Record<string, unknown>)} /></section><section className="panel"><div className="section-title"><div><div className="eyebrow">Evidence timeline</div><h2>Fund movement chronology</h2></div><span className="muted">Newest first</span></div><Timeline rows={filteredTransactions} onSelect={(row) => setSelected(row as Record<string, unknown>)} /></section></>}
  </main>
}
