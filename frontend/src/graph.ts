import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import type { GraphPayload } from './types'

function key(value: string | undefined) {
  return value ?? ''
}

function short(value: string) {
  return value.length > 20 ? `${value.slice(0, 9)}...${value.slice(-7)}` : value
}

export function toElements(graph: GraphPayload): ElementDefinition[] {
  const nodes = graph.nodes ?? []
  const ids = new Set(nodes.flatMap((node) => [key(node.id), key(node.identity)]))
  const elements: ElementDefinition[] = nodes.map((node, index) => {
    const id = key(node.identity) || key(node.id) || `node-${index}`
    const kind = String(node.type ?? 'unknown').toLowerCase()
    const rawLabel = String(node.label ?? node.address ?? node.name ?? node.tx_hash ?? id)
    const label = kind === 'transaction' ? `${node.asset ?? 'TX'} ${node.amount ?? ''}`.trim() : short(rawLabel)
    return { data: { ...node, id, kind, label, is_target: String(node.is_target ?? '') } }
  })
  for (const edge of graph.edges ?? []) {
    const source = ids.has(edge.source) ? edge.source : edge.source.replace(/^address:/, '')
    const target = ids.has(edge.target) ? edge.target : edge.target.replace(/^address:/, '')
    if (source && target && ids.has(source) && ids.has(target)) {
      elements.push({ data: { ...edge, id: `${source}-${target}-${elements.length}`, source, target, label: edge.type ?? '' } })
    }
  }
  return elements
}

export function renderGraph(container: HTMLDivElement, graph: GraphPayload, onSelect: (data: Record<string, unknown>) => void): Core {
  const cy = cytoscape({
    container,
    elements: toElements(graph),
    layout: { name: 'cose', animate: false, padding: 42, idealEdgeLength: 120 },
    style: [
      { selector: 'node', style: { label: 'data(label)', 'background-color': '#7ee7c5', color: '#eaf4ff', 'font-size': '10px', 'text-wrap': 'wrap', 'text-max-width': '90px', 'text-valign': 'center', 'text-halign': 'center', width: 34, height: 34, 'border-width': 2, 'border-color': '#17334b' } },
      { selector: 'node[kind = "wallet"]', style: { shape: 'ellipse', 'background-color': '#7ee7c5' } },
      { selector: 'node[kind = "transaction"]', style: { shape: 'round-rectangle', 'background-color': '#7aa9ff', width: 56, height: 32 } },
      { selector: 'node[kind = "entity"]', style: { shape: 'hexagon', 'background-color': '#ffd166' } },
      { selector: 'node[is_target = "true"]', style: { 'border-color': '#fff3b0', 'border-width': 5, width: 44, height: 44 } },
      { selector: 'edge', style: { width: 1.5, 'line-color': '#49647d', 'target-arrow-color': '#7aa9ff', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', opacity: 0.75 } },
    ],
  })
  cy.on('tap', 'node', (event) => onSelect(event.target.data() as Record<string, unknown>))
  return cy
}
