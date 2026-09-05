import type { Transaction } from '../types'

export type Filters = { direction: string; asset: string; provider: string; transactionType: string; query: string; minAmount: string; startDate: string; endDate: string; hopLevel: string; vaspState: string; showTransactions: boolean }

type Props = { transactions: Transaction[]; value: Filters; onChange: (value: Filters) => void }

function options(rows: Transaction[], field: keyof Transaction) {
  return [...new Set(rows.map((row) => String(row[field] ?? '')).filter(Boolean))].sort()
}

export function FilterBar({ transactions, value, onChange }: Props) {
  const update = (key: keyof Filters, next: string | boolean) => onChange({ ...value, [key]: next })
  return <div className="filter-bar">
    <input value={value.query} onChange={(event) => update('query', event.target.value)} placeholder="Find address or hash" aria-label="Find address or hash" />
    <select value={value.direction} onChange={(event) => update('direction', event.target.value)} aria-label="Direction">
      <option value="">All directions</option><option value="in">Incoming</option><option value="out">Outgoing</option><option value="self">Self</option><option value="unknown">Unknown</option>
    </select>
    <select value={value.asset} onChange={(event) => update('asset', event.target.value)} aria-label="Asset"><option value="">All assets</option>{options(transactions, 'asset').map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.provider} onChange={(event) => update('provider', event.target.value)} aria-label="Provider"><option value="">All providers</option>{options(transactions, 'provider').map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.transactionType} onChange={(event) => update('transactionType', event.target.value)} aria-label="Transaction type"><option value="">All types</option>{options(transactions, 'transaction_type').map((item) => <option key={item}>{item}</option>)}</select>
    <input type="number" min="0" value={value.minAmount} onChange={(event) => update('minAmount', event.target.value)} placeholder="Min amount" aria-label="Minimum amount" />
    <input type="date" value={value.startDate} onChange={(event) => update('startDate', event.target.value)} aria-label="Start date" />
    <input type="date" value={value.endDate} onChange={(event) => update('endDate', event.target.value)} aria-label="End date" />
    <select value={value.hopLevel} onChange={(event) => update('hopLevel', event.target.value)} aria-label="Hop level"><option value="">All hops</option>{options(transactions, 'hop_level').map((item) => <option key={item}>{item}</option>)}</select>
    <select value={value.vaspState} onChange={(event) => update('vaspState', event.target.value)} aria-label="VASP state"><option value="">All VASP states</option><option value="identified">Identified</option><option value="cluster_only">Cluster only</option><option value="conflict">Conflict</option><option value="unidentified">Unidentified</option></select>
    <label className="toggle"><input type="checkbox" checked={value.showTransactions} onChange={(event) => update('showTransactions', event.target.checked)} /> transaction nodes</label>
  </div>
}
