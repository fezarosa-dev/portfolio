'use client'

import { useEffect, useRef, useState } from 'react'
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
import { architectureEdges, architectureNodes, type ArchNodeId } from './nodes-data'

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

// canvas com tamanho fixo em px ("mundo"), que a gente translada/escala pra
// simular pan/zoom -- os nós ficam em unidades 0-100 nos dados (nodes-data.ts)
// e são convertidos pra px do mundo aqui.
const WORLD_W = 1400
const WORLD_H = 800
const MIN_SCALE = 0.4
const MAX_SCALE = 2.2

function toX(unit: number) {
  return (unit / 100) * WORLD_W
}
function toY(unit: number) {
  return (unit / 100) * WORLD_H
}

function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

export function ArchitectureMap() {
  const { enabled: reduceMotion } = useReduceMotion()
  const [openNodeId, setOpenNodeId] = useState<ArchNodeId | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.85 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const nodeById = new Map(architectureNodes.map((n) => [n.id, n]))
  const openNode = openNodeId ? nodeById.get(openNodeId) : undefined

  // centraliza o conteúdo do mapa na tela quando a página carrega
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const scale = 0.85
    setTransform({
      x: el.clientWidth / 2 - (WORLD_W / 2) * scale,
      y: el.clientHeight / 2 - (WORLD_H * 0.48) * scale,
      scale,
    })
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y }
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d) return
    setTransform((t) => ({ ...t, x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) }))
  }
  function handlePointerUp() {
    dragRef.current = null
    setDragging(false)
  }
  // ponytail: zoom sempre em torno do centro do canvas, não do cursor --
  // preciso pra "zoom no ponteiro" seria mais código pra pouco ganho aqui,
  // já que o pan resolve o resto
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale - e.deltaY * 0.001)) }))
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      className={`relative h-full w-full touch-none overflow-hidden ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundImage: 'radial-gradient(circle, var(--hairline) 1px, transparent 1px)',
        backgroundSize: `${28 * transform.scale}px ${28 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left select-none"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg width={WORLD_W} height={WORLD_H} className="absolute inset-0" aria-hidden>
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
            return (
              <motion.path
                key={`${edge.from}-${edge.to}`}
                d={curvePath(toX(from.x), toY(from.y), toX(to.x), toY(to.y))}
                fill="none"
                stroke="var(--signal)"
                strokeOpacity={0.55}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="3 14"
                markerEnd="url(#arch-arrow)"
                animate={reduceMotion ? undefined : { strokeDashoffset: [0, -34] }}
                transition={reduceMotion ? undefined : { duration: 1.4, ease: 'linear', repeat: Infinity }}
              />
            )
          })}
          {openNode &&
            openNode.microSteps.map((_step, i) => {
              const side = openNode.x < 50 ? 1 : -1
              const stepUnitX = openNode.x + side * 18
              const stepUnitY = Math.min(96, openNode.y + (i + 1) * 11)
              const prevUnitY = i === 0 ? openNode.y : Math.min(96, openNode.y + i * 11)
              const prevUnitX = i === 0 ? openNode.x : stepUnitX
              return (
                <motion.path
                  key={`step-edge-${openNode.id}-${i}`}
                  d={curvePath(toX(prevUnitX), toY(prevUnitY), toX(stepUnitX), toY(stepUnitY))}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.1, ease: 'easeOut' }}
                />
              )
            })}
        </svg>

        {architectureEdges.map((edge) => {
          const from = nodeById.get(edge.from)
          const to = nodeById.get(edge.to)
          if (!from || !to) return null
          return (
            <span
              key={`label-${edge.from}-${edge.to}`}
              style={{ left: toX((from.x + to.x) / 2), top: toY((from.y + to.y) / 2) }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline bg-background px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-steel"
            >
              {edge.label}
            </span>
          )
        })}

        <TooltipProvider>
          {architectureNodes.map((node, i) => {
            const Icon = ICONS[node.id]
            const isOpen = openNodeId === node.id
            return (
              <Tooltip key={node.id}>
                <TooltipTrigger
                  render={
                    <motion.button
                      data-node
                      onClick={() => setOpenNodeId((current) => (current === node.id ? null : node.id))}
                      style={{ left: toX(node.x), top: toY(node.y) }}
                      className={`absolute z-10 flex w-56 -translate-x-1/2 -translate-y-1/2 items-start gap-2 rounded-xl border px-4 py-3 text-left shadow-lg transition-transform hover:scale-105 motion-reduce:transition-none ${isOpen ? 'border-signal bg-card' : 'border-hairline bg-card'}`}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    />
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-sm font-medium text-foreground">{node.label}</span>
                    <span className="block truncate text-xs text-steel">{node.summary}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-56">
                  {node.detail}
                  <span className="mt-1 block text-signal">clique pra ver o pipeline dessa peça</span>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>

        {openNode &&
          openNode.microSteps.map((step, i) => {
            const side = openNode.x < 50 ? 1 : -1
            const stepUnitX = openNode.x + side * 18
            const stepUnitY = Math.min(96, openNode.y + (i + 1) * 11)
            return (
              <motion.div
                key={`step-${openNode.id}-${i}`}
                data-node
                style={{ left: toX(stepUnitX), top: toY(stepUnitY) }}
                className="absolute z-10 flex w-52 -translate-x-1/2 -translate-y-1/2 items-start gap-2 rounded-lg border border-accent/50 bg-popover px-3 py-2 shadow-md"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent font-mono text-[10px] text-accent">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-medium text-foreground">{step.label}</span>
                  <span className="block text-[11px] text-steel">{step.detail}</span>
                </span>
              </motion.div>
            )
          })}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-hairline bg-card/80 px-3 py-1.5 font-mono text-[11px] text-steel backdrop-blur">
        arraste pra mover · role o mouse pra zoom · clique num nó pra ver o pipeline
      </div>
    </div>
  )
}
