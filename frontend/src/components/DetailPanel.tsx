function display(value: unknown) {
  return value === undefined || value === null || value === '' ? '-' : String(value)
}

type Props = { selected: Record<string, unknown> | null }

export function DetailPanel({ selected }: Props) {
  if (!selected) return <div className="empty-panel">Select a wallet, transaction, or entity to inspect its evidence.</div>
  const entries = Object.entries(selected).filter(([key]) => key !== 'raw' && key !== 'properties' && valueIsUseful(selected[key]))
  return <div className="detail-panel"><div className="eyebrow">Selected evidence</div><h3>{display(selected.label ?? selected.address ?? selected.name ?? selected.tx_hash ?? selected.event_id)}</h3>{entries.map(([key, value]) => <div className="detail-row" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{Array.isArray(value) ? value.join(', ') : display(value)}</strong></div>)}</div>
}

function valueIsUseful(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}
