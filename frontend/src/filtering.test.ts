import { describe, expect, it } from 'vitest'
import { filterTransactions, type FilterState } from './filtering'
import type { Transaction } from './types'

const rows: Transaction[] = [
  { event_id: 'a', tx_hash: '0xaaa', direction: 'out', asset: 'ETH', amount: '2', timestamp: 1704067200, provider: 'etherscan', transaction_type: 'native', hop_level: 1 },
  { event_id: 'b', tx_hash: '0xbbb', direction: 'in', asset: 'USDT', amount: '10', timestamp: 1704153600, provider: 'alchemy', transaction_type: 'token_transfer', hop_level: 2 },
]
const base: FilterState = { direction: '', asset: '', provider: '', transactionType: '', query: '', minAmount: '', startDate: '', endDate: '', hopLevel: '', vaspState: '' }

describe('filterTransactions', () => {
  it('filters by direction, asset, provider, amount, and hop', () => {
    expect(filterTransactions(rows, { ...base, direction: 'out', asset: 'ETH', provider: 'etherscan', minAmount: '1', hopLevel: '1' })).toHaveLength(1)
  })
  it('searches transaction identifiers and addresses', () => {
    expect(filterTransactions([{ ...rows[0], from_address: 'wallet-needle' }], { ...base, query: 'needle' })).toHaveLength(1)
  })
})
