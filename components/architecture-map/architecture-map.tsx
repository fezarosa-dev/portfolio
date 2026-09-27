'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  Globe,
  HardDrive,
  LayoutDashboard,
  Mail,
  Plug,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { architectureEdges, architectureNodes, type ArchNode, type ArchNodeId } from './nodes-data'

const ICONS: Record<ArchNodeId, LucideIcon> = {
  'paginas-publicas': Globe,
  busca: Search,
  supabase: Database,
  admin: LayoutDashboard,
  drive: HardDrive,
  mcp: Plug,
  contato: Mail,
  'easter-eggs': Sparkles,
  status: Activity,
}

function curvePath(from: ArchNode, to: ArchNode) {
  const mx = (from.x + to.x) / 2
  return {
    d: `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`,
    midX: mx,
    midY: (from.y + to.y) / 2,
  }
}

export function ArchitectureMap() {
  const { enabled: reduceMotion } = useReduceMotion()
  const [openNodeId, setOpenNodeId] = useState<ArchNodeId | null>(null)
  const nodeById = new Map(architectureNodes.map((n) => [n.id, n]))
  const openNode = openNodeId ? nodeById.get(openNodeId) : undefined
  const OpenIcon = openNode ? ICONS[openNode.id] : null

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--hairline) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
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
          const { d } = curvePath(from, to)
          return (
            <motion.path
              key={`${edge.from}-${edge.to}`}
              d={d}
              fill="none"
              stroke="var(--signal)"
              strokeOpacity={0.55}
              strokeWidth={0.4}
              strokeLinecap="round"
              strokeDasharray="0.5 2.5"
              markerEnd="url(#arch-arrow)"
              vectorEffect="non-scaling-stroke"
              animate={reduceMotion ? undefined : { strokeDashoffset: [0, -9] }}
              transition={reduceMotion ? undefined : { duration: 1.4, ease: 'linear', repeat: Infinity }}
            />
          )
        })}
      </svg>

      {architectureEdges.map((edge) => {
        const from = nodeById.get(edge.from)
        const to = nodeById.get(edge.to)
        if (!from || !to) return null
        const { midX, midY } = curvePath(from, to)
        return (
          <span
            key={`label-${edge.from}-${edge.to}`}
            style={{ left: `${midX}%`, top: `${midY}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline bg-background px-2 py-0.5 font-mono text-[9px] whitespace-nowrap text-steel"
          >
            {edge.label}
          </span>
        )
      })}

      <TooltipProvider>
        {architectureNodes.map((node, i) => {
          const Icon = ICONS[node.id]
          return (
            <Tooltip key={node.id}>
              <TooltipTrigger
                render={
                  <motion.button
                    onClick={() => setOpenNodeId(node.id)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className="absolute z-10 flex w-44 -translate-x-1/2 -translate-y-1/2 items-start gap-2 rounded-xl border border-hairline bg-card px-3 py-2.5 text-left shadow-lg transition-transform hover:scale-105 motion-reduce:transition-none"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-medium text-foreground">{node.label}</span>
                  <span className="block truncate text-[10px] text-steel">{node.summary}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-56">
                {node.detail}
                <span className="mt-1 block text-signal">clique pra ver o passo a passo</span>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>

      <Dialog open={openNode !== undefined} onOpenChange={(open) => !open && setOpenNodeId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          {openNode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
                    {OpenIcon && <OpenIcon className="h-4 w-4" aria-hidden />}
                  </span>
                  {openNode.label}
                </DialogTitle>
                <DialogDescription>{openNode.detail}</DialogDescription>
              </DialogHeader>
              <ol className="relative ml-3 flex flex-col gap-4 border-l border-hairline pl-5">
                {openNode.microSteps.map((step, i) => (
                  <motion.li
                    key={step.label}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <span className="absolute top-0.5 -left-[26px] flex h-4 w-4 items-center justify-center rounded-full border border-signal bg-background font-mono text-[9px] text-signal">
                      {i + 1}
                    </span>
                    <p className="font-mono text-xs font-medium text-foreground">{step.label}</p>
                    <p className="mt-0.5 text-xs text-steel">{step.detail}</p>
                  </motion.li>
                ))}
              </ol>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
