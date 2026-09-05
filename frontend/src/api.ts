import type { GraphPayload, InvestigationInput, InvestigationResult } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.detail ?? 'Request failed')
  }
  return payload as T
}

export function investigate(input: InvestigationInput) {
  return request<InvestigationResult>('/api/v1/investigate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loadGraph(investigationId: string) {
  return request<GraphPayload>(`/api/v1/graph/${encodeURIComponent(investigationId)}`)
}

export function graphStatus() {
  return request<Record<string, unknown>>('/api/v1/graph/status')
}
