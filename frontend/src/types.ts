export type GraphNode = {
  id?: string
  identity?: string
  type?: string
  label?: string
  address?: string
  name?: string
  chain?: string
  [key: string]: unknown
}

export type GraphEdge = {
  source: string
  target: string
  type?: string
  properties?: Record<string, unknown>
}

export type GraphPayload = {
  status?: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  node_count?: number
  edge_count?: number
}

export type Transaction = {
  event_id?: string
  tx_hash?: string
  timestamp?: number
  from_address?: string
  to_address?: string
  from_addresses?: string[]
  to_addresses?: string[]
  direction?: string
  transaction_type?: string
  event_type?: string
  asset?: string
  amount?: string
  amount_raw?: string
  provider?: string
  hop_level?: number
  vasp_state?: string
  chain?: string
  [key: string]: unknown
}

export type InvestigationResult = {
  investigation_id: string
  address: string
  chain: string
  queried_at: string
  wallet?: Record<string, unknown>
  normalized?: {
    transactions?: Transaction[]
    counterparties?: Array<{ address: string; count: number }>
    counts?: Record<string, number>
    [key: string]: unknown
  }
  transactions?: Transaction[]
  counterparties?: Array<{ address: string; count: number }>
  graph?: GraphPayload
  graph_sync?: Record<string, unknown>
  vasp?: Record<string, unknown>
  derived?: Record<string, unknown>
  errors?: string[]
  storage?: Record<string, string>
}

export type InvestigationInput = {
  address: string
  chain: string
  case_id: string
  complaint_id: string
  fraud_type: string
  reported_amount: string
  reported_at: string
  victim_reference: string
  include_vasp: boolean
  include_raw: boolean
  force_refresh: boolean
}
