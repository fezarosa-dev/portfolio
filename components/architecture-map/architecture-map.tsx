'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  Globe,
  HardDrive,
  LayoutDashboard,
  Locate,
  Mail,
  Plug,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

// canvas com tamanho fixo em px ("mundo"), que a gente translada/escala pra
// simular pan/zoom -- os nós ficam em unidades 0-100 nos dados (nodes-data.ts,
// mas os pipelines de cada um se estendem além disso, então o mundo é bem
// maior que a área 0-100 pra caber tudo sem sobrepor.
const WORLD_W = 2200
const WORLD_H = 1400
const INITIAL_SCALE = 0.55
const MIN_SCALE = 0.25
const MAX_SCALE = 2.2
// unidades (mesma escala 0-100 dos nós) que cada passo do pipeline avança
// na direção `dir` do nó
const STEP_DISTANCE = 16

function toX(unit: number) {
  return (unit / 100) * WORLD_W
}
function toY(unit: number) {
  return (unit / 100) * WORLD_H
}

// posição (em unidades) do nó, ou de um passo específico do pipeline dele
// quando `step` é passado -- mesma fórmula usada pros cards de passo, pra
// garantir que a conexão sempre chega exatamente no lugar certo
function nodePoint(node: ArchNode, step?: number) {
  if (step === undefined) return { x: node.x, y: node.y }
  return {
    x: node.x + node.dir.dx * STEP_DISTANCE * (step + 1),
    y: node.y + node.dir.dy * STEP_DISTANCE * (step + 1),
  }
}

function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

export function ArchitectureMap() {
  const { enabled: reduceMotion } = useReduceMotion()
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: INITIAL_SCALE })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const nodeById = new Map(architectureNodes.map((n) => [n.id, n]))

  function centerView(scale = INITIAL_SCALE) {
    const el = containerRef.current
    if (!el) return
    // centraliza na área onde os 9 nós macro ficam (x:15-85, y:5-90), não no
    // mundo inteiro -- os pipelines se estendem pra fora disso, e é sempre
    // pra essa vista "de longe" que o botão de recentralizar deve voltar
    setTransform({
      x: el.clientWidth / 2 - toX(50) * scale,
      y: el.clientHeight / 2 - toY(47) * scale,
      scale,
    })
  }

  useEffect(() => {
    centerView()
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
        {/* overflow-visible é essencial: os passos de um pipeline se estendem
            além da caixa WORLD_W x WORLD_H (ex: busca vai de x=85 até x=165
            em unidades), e SVG recorta filhos fora da própria largura/altura
            por padrão -- sem isso, as conexões entre os passos mais distantes
            do nó ficavam invisíveis, cortadas pelo próprio <svg>. */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          className="absolute inset-0 overflow-visible"
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
            <marker
              id="arch-arrow-accent"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {architectureEdges.map((edge) => {
            const from = nodeById.get(edge.from)
            const to = nodeById.get(edge.to)
            if (!from || !to) return null
            const fromPoint = nodePoint(from, edge.fromStep)
            const toPoint = nodePoint(to, edge.toStep)
            return (
              <motion.path
                key={`${edge.from}-${edge.to}`}
                d={curvePath(toX(fromPoint.x), toY(fromPoint.y), toX(toPoint.x), toY(toPoint.y))}
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
          {architectureNodes.map((node) =>
            node.microSteps.map((_step, i) => {
              const prevUnitX = node.x + node.dir.dx * STEP_DISTANCE * i
              const prevUnitY = node.y + node.dir.dy * STEP_DISTANCE * i
              const stepUnitX = node.x + node.dir.dx * STEP_DISTANCE * (i + 1)
              const stepUnitY = node.y + node.dir.dy * STEP_DISTANCE * (i + 1)
              return (
                <motion.path
                  key={`step-edge-${node.id}-${i}`}
                  d={curvePath(toX(prevUnitX), toY(prevUnitY), toX(stepUnitX), toY(stepUnitY))}
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={0.8}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="3 10"
                  markerEnd="url(#arch-arrow-accent)"
                  animate={reduceMotion ? undefined : { strokeDashoffset: [0, -26] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 1, ease: 'linear', repeat: Infinity, delay: i * 0.15 }
                  }
                />
              )
            })
          )}
        </svg>

        {architectureEdges.map((edge) => {
          const from = nodeById.get(edge.from)
          const to = nodeById.get(edge.to)
          if (!from || !to) return null
          const fromPoint = nodePoint(from, edge.fromStep)
          const toPoint = nodePoint(to, edge.toStep)
          return (
            <span
              key={`label-${edge.from}-${edge.to}`}
              style={{ left: toX((fromPoint.x + toPoint.x) / 2), top: toY((fromPoint.y + toPoint.y) / 2) }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline bg-background px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-steel"
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
                      data-node
                      style={{ left: toX(node.x), top: toY(node.y) }}
                      className="absolute z-10 flex w-56 -translate-x-1/2 -translate-y-1/2 items-start gap-2 rounded-xl border border-hairline bg-card px-4 py-3 text-left shadow-lg transition-transform hover:scale-105 motion-reduce:transition-none"
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
                <TooltipContent className="max-w-56">{node.detail}</TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>

        {architectureNodes.map((node) =>
          node.microSteps.map((step, i) => {
            const stepUnitX = node.x + node.dir.dx * STEP_DISTANCE * (i + 1)
            const stepUnitY = node.y + node.dir.dy * STEP_DISTANCE * (i + 1)
            return (
              <motion.div
                key={`step-${node.id}-${i}`}
                data-node
                style={{ left: toX(stepUnitX), top: toY(stepUnitY) }}
                className="absolute z-10 flex w-52 -translate-x-1/2 -translate-y-1/2 items-start gap-2 rounded-lg border border-accent/50 bg-popover px-3 py-2 shadow-md"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
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
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => centerView(transform.scale)}
        title="Recentralizar o mapa"
        className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-full border border-hairline bg-card/80 px-3 py-1.5 font-mono text-xs text-steel backdrop-blur transition-colors hover:border-signal hover:text-signal"
      >
        <Locate className="h-3.5 w-3.5" aria-hidden />
        recentralizar
      </button>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-hairline bg-card/80 px-3 py-1.5 font-mono text-[11px] text-steel backdrop-blur">
        arraste pra mover · role o mouse pra zoom
      </div>
    </div>
  )
}
