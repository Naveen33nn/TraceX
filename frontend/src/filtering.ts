import type { Transaction } from './types'

export type FilterState = {
  direction: string
  asset: string
  provider: string
  transactionType: string
  query: string
  minAmount: string
  startDate: string
  endDate: string
  hopLevel: string
  vaspState: string
}

export function filterTransactions(rows: Transaction[], filters: FilterState): Transaction[] {
  const needle = filters.query.toLowerCase()
  const start = filters.startDate ? Date.parse(`${filters.startDate}T00:00:00Z`) / 1000 : 0
  const end = filters.endDate ? Date.parse(`${filters.endDate}T23:59:59Z`) / 1000 : Number.MAX_SAFE_INTEGER
  return rows.filter((row) => {
    const searchable = [row.tx_hash, row.event_id, row.from_address, row.to_address, ...(row.from_addresses ?? []), ...(row.to_addresses ?? [])].join(' ').toLowerCase()
    const amount = Number(row.amount ?? 0)
    const timestamp = Number(row.timestamp ?? 0)
    return (!filters.direction || row.direction === filters.direction) && (!filters.asset || row.asset === filters.asset) && (!filters.provider || row.provider === filters.provider) && (!filters.transactionType || row.transaction_type === filters.transactionType) && (!needle || searchable.includes(needle)) && (!filters.minAmount || amount >= Number(filters.minAmount)) && timestamp >= start && timestamp <= end && (!filters.hopLevel || String(row.hop_level ?? 0) === filters.hopLevel) && (!filters.vaspState || String(row.vasp_state ?? '') === filters.vaspState)
  })
}
