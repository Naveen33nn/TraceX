import type { Transaction } from '../types'

function display(value: unknown) {
  return value === undefined || value === null || value === '' ? '-' : String(value)
}

function shorten(value: unknown) {
  const text = display(value)
  return text.length > 23 ? `${text.slice(0, 10)}...${text.slice(-9)}` : text
}

type Props = { rows: Transaction[]; onSelect: (row: Transaction) => void }

export function TransactionTable({ rows, onSelect }: Props) {
  return <div className="table-wrap"><table><thead><tr><th>Time</th><th>Direction</th><th>Asset</th><th>Amount</th><th>From</th><th>To</th><th>Provider</th></tr></thead><tbody>
    {rows.slice(0, 500).map((row, index) => <tr key={`${row.event_id ?? row.tx_hash ?? 'row'}-${index}`} onClick={() => onSelect(row)}><td>{row.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : '-'}</td><td><span className={`badge ${row.direction ?? 'unknown'}`}>{display(row.direction)}</span></td><td>{display(row.asset)}</td><td>{display(row.amount)}</td><td title={display(row.from_address)}>{shorten(row.from_address)}</td><td title={display(row.to_address)}>{shorten(row.to_address)}</td><td>{display(row.provider)}</td></tr>)}
  </tbody></table>{rows.length > 500 && <p className="muted">Showing the first 500 filtered transactions.</p>}</div>
}
