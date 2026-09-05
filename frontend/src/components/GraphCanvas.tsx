import { useEffect, useRef } from 'react'
import type { Core } from 'cytoscape'
import { renderGraph } from '../graph'
import type { GraphPayload } from '../types'

type Props = { graph: GraphPayload; onSelect: (data: Record<string, unknown>) => void }

export function GraphCanvas({ graph, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  useEffect(() => {
    if (!container.current) return
    cyRef.current?.destroy()
    cyRef.current = renderGraph(container.current, graph, onSelect)
    return () => cyRef.current?.destroy()
  }, [graph, onSelect])

  return <div className="graph-canvas" ref={container} aria-label="Transaction graph" />
}
