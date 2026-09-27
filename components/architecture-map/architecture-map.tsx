'use client'

import { architectureEdges, architectureNodes, type ArchNode } from './nodes-data'

function edgePoints(from: ArchNode, to: ArchNode) {
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
}

export function ArchitectureMap() {
  const nodeById = new Map(architectureNodes.map((n) => [n.id, n]))

  return (
    <div className="relative aspect-[4/3] w-full overflow-visible">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {architectureEdges.map((edge) => {
          const from = nodeById.get(edge.from)
          const to = nodeById.get(edge.to)
          if (!from || !to) return null
          const { x1, y1, x2, y2 } = edgePoints(from, to)
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--hairline)"
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      {architectureNodes.map((node) => (
        <button
          key={node.id}
          type="button"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm"
        >
          {node.label}
        </button>
      ))}
    </div>
  )
}
