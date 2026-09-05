import type { Transaction } from '../types'

function shorten(value: unknown) {
  const text = String(value ?? '-')
  return text.length > 24 ? `${text.slice(0, 11)}...${text.slice(-9)}` : text
}

type Props = { rows: Transaction[]; onSelect: (row: Transaction) => void }

export function Timeline({ rows, onSelect }: Props) {
  return <div className="timeline">
    {rows.slice(0, 100).map((row, index) => <button className="timeline-item" key={`${row.event_id ?? row.tx_hash ?? 'event'}-${index}`} onClick={() => onSelect(row)}>
      <span className="timeline-time">{row.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : 'Time unavailable'}</span>
      <span className="timeline-line" />
      <span className="timeline-body"><strong>{row.direction ?? 'unknown'} {row.asset ?? 'asset'} {row.amount ?? ''}</strong><span>{shorten(row.from_address)} to {shorten(row.to_address)}</span><small>{row.provider ?? 'provider unavailable'} | {row.transaction_type ?? 'transaction'}</small></span>
    </button>)}
    {!rows.length && <div className="empty-panel">No events match the active filters.</div>}
  </div>
}
