import type { GraphPayload, InvestigationInput, InvestigationResult } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.detail ?? payload.message ?? 'Request failed')
  }
  return payload as T
}

export interface AddressResolveResult {
  address: string
  valid: boolean
  detected_format: string | null
  suggested_chain: 'bitcoin' | 'ethereum' | 'polygon' | 'tron' | null
  network_selection_required: boolean
  note?: string
}

export function resolveAddress(address: string): Promise<AddressResolveResult> {
  return request<AddressResolveResult>(`/api/v1/resolve?address=${encodeURIComponent(address)}`)
}

export function investigate(input: InvestigationInput): Promise<InvestigationResult> {
  return request<InvestigationResult>('/api/v1/investigate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loadGraph(investigationId: string): Promise<GraphPayload> {
  return request<GraphPayload>(`/api/v1/graph/${encodeURIComponent(investigationId)}`)
}

export function graphStatus(): Promise<{ status: string; driver?: string; nodes?: number }> {
  return request<{ status: string }>('/api/v1/graph/status')
}

export function checkVASP(address: string, chain = 'auto', forceRefresh = false) {
  return request('/api/v1/vasp/check', {
    method: 'POST',
    body: JSON.stringify({ address, chain, force_refresh: forceRefresh }),
  })
}

export function getProviderConfig() {
  return request<Record<string, unknown>>('/api/v1/provider-config')
}
