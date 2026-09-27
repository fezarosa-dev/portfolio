'use client'

import { motion } from 'framer-motion'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { architectureEdges, architectureNodes, type ArchNode } from './nodes-data'

function edgePoints(from: ArchNode, to: ArchNode) {
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
}

export function ArchitectureMap() {
  const { enabled: reduceMotion } = useReduceMotion()
  const nodeById = new Map(architectureNodes.map((n) => [n.id, n]))

  return (
    <div className="relative aspect-[4/3] w-full overflow-visible">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <marker
            id="arch-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--signal)" />
          </marker>
        </defs>
        {architectureEdges.map((edge) => {
          const from = nodeById.get(edge.from)
          const to = nodeById.get(edge.to)
          if (!from || !to) return null
          const { x1, y1, x2, y2 } = edgePoints(from, to)
          return (
            <motion.line
              key={`${edge.from}-${edge.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--signal)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
              strokeDasharray="2 2"
              markerEnd="url(#arch-arrow)"
              vectorEffect="non-scaling-stroke"
              animate={reduceMotion ? undefined : { strokeDashoffset: [0, -8] }}
              transition={reduceMotion ? undefined : { duration: 1.2, ease: 'linear', repeat: Infinity }}
            />
          )
        })}
      </svg>
      {architectureNodes.map((node) => (
        <button
          key={node.id}
          type="button"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm transition-transform hover:scale-105 motion-reduce:transition-none"
        >
          {node.label}
        </button>
      ))}
    </div>
  )
}
