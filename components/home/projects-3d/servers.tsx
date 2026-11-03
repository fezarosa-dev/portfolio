'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import { CARAMEL, clamp01, RBox, DISPLAY, easeInOut, Glow, METAL, MONO, MONO_BOLD, seeded, segment, SIGNAL } from './scene-kit'

/** Uma gaveta do servidor: uma categoria de tecnologia do projeto e as tecnologias dela. */
export type Drawer = { label: string; techs: string[] }

/** Um servidor por projeto da home; null = servidor desligado (sem projeto). */
export type ServerProject = {
  title: string
  company: string | null
  href: string
  external: boolean
  status: string | null
  highlight: string | null
  summary: string | null
  drawers: Drawer[]
} | null

// tudo dos servidores e do foguete é cortado abaixo do chão: eles sobem "de dentro" da plataforma
const FLOOR_CLIP = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.125)]

// medidas do rack (o chão da plataforma fica em y = -1,12)
const W = 0.7
const H = 1.9
const D = 0.8
const FLOOR = -1.12
const UNITS = 8
const UNIT_H = 0.15
const SPACING = 0.95
const unitY = (i: number) => -H / 2 + 0.12 + i * 0.172
// fases dentro do trecho dos servidores (s, 0..1): a carcaça sobe, as gavetas chegam, liga, abre um pouco
const RISE = [0, 0.38] as const
const SLOT = [0.36, 0.66] as const
const POWER = [0.64, 0.74] as const
const OPEN = [0.8, 0.96] as const
// no foguete (r, 0..1): recolhe as gavetas, os racks viram propulsores em volta do corpo central e decola
const RETRACT = [0, 0.12] as const
const ASSEMBLE = [0.08, 0.5] as const
const IGNITE = [0.45, 0.6] as const
const LIFTOFF = [0.55, 1] as const
const BOOSTER_R = 0.78
const BOOSTER_SCALE = 0.62

/** Altura do conjunto do foguete na decolagem (a câmera acompanha um pouco). */
export const liftHeight = (r: number) => Math.pow(segment(r, LIFTOFF[0], LIFTOFF[1]), 2.2) * 7

// frente lisa de uma gaveta 2U: o texto fica à esquerda; à direita, baias de disco e grade de ventilação
function faceplateTexture(blank: boolean) {
  const w = 512
  const h = 110
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = blank ? '#1a1417' : '#211a1e'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#2d2429'
  ctx.fillRect(0, 0, w, 5)
  ctx.fillRect(0, h - 5, w, 5)
  const vents = blank ? [40, 470] : [372, 470]
  for (let y = 18; y < h - 16; y += 9)
    for (let x = vents[0]; x < vents[1]; x += 9) {
      ctx.fillStyle = '#0e0a0c'
      ctx.fillRect(x, y, 5, 5)
    }
  if (!blank)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#151013'
      ctx.fillRect(250 + i * 38, 16, 32, 78)
      ctx.fillStyle = '#3a2f35'
      ctx.fillRect(254 + i * 38, 82, 24, 6)
    }
  ctx.fillStyle = '#4a3f45'
  ctx.fillRect(6, 24, 10, 62)
  ctx.fillRect(w - 16, 24, 10, 62)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

type Faces = { full: THREE.Texture; blank: THREE.Texture }

// uma gaveta: chega voando pela frente e encaixa no slot; depois pode deslizar um pouco para fora
function DrawerUnit({
  index,
  drawer,
  faces,
  arriveRef,
  openRef,
  ledRef,
  hovered,
  engagedRef,
  readableRef,
  onHover,
  side,
}: {
  index: number
  drawer: Drawer | null
  faces: Faces
  arriveRef: React.RefObject<number[]>
  openRef: React.RefObject<number>
  ledRef: (i: number, m: THREE.MeshStandardMaterial | null) => void
  /** a gaveta sob o mouse sai mais para fora e mostra o que tem dentro */
  hovered: boolean
  engagedRef: React.RefObject<boolean>
  /** false no foguete: o texto da gaveta não precisa ser desenhado */
  readableRef: React.RefObject<boolean>
  onHover: (index: number | null) => void
  /** lado do cartão: o rack da ponta direita abre o cartão para a esquerda */
  side: 1 | -1
}) {
  const group = useRef<THREE.Group>(null)
  const pull = useRef(0)
  const card = useRef<HTMLDivElement>(null)
  const text = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (text.current) text.current.visible = readableRef.current ?? true
    const on = hovered && engagedRef.current
    pull.current += ((on ? 1 : 0) - pull.current) * (1 - Math.exp(-dt * 10))
    if (card.current) card.current.style.opacity = String(on ? clamp01(pull.current * 1.5) : 0)
    const a = easeInOut(arriveRef.current?.[index] ?? 0)
    if (!group.current) return
    group.current.visible = a > 0.001
    // vem de frente e de lado, girando, e entra reta no slot
    const away = 1 - a
    const open = (openRef.current ?? 0) * (0.03 + index * 0.012) + pull.current * 0.3
    group.current.position.set(away * (index % 2 ? 0.9 : -0.9), unitY(index) + away * 0.5, D / 2 - 0.36 + away * 1.8 + open)
    group.current.rotation.set(0, away * (index % 2 ? -0.9 : 0.9), away * 0.4)
  })
  return (
    <group
      ref={group}
      visible={false}
      onPointerOver={(e) => {
        if (!drawer) return
        e.stopPropagation()
        onHover(index)
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* corpo da gaveta (aparece quando ela está para fora) e a frente */}
      <mesh>
        <boxGeometry args={[W - 0.1, UNIT_H - 0.01, 0.72]} />
        <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color="#1c161a" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.362]}>
        <planeGeometry args={[W - 0.08, UNIT_H]} />
        <meshStandardMaterial clippingPlanes={FLOOR_CLIP} map={drawer ? faces.full : faces.blank} metalness={0.5} roughness={0.5} />
      </mesh>
      {drawer && (
        <group position={[-W / 2 + 0.07, 0, 0.364]}>
          {[0, 1].map((j) => (
            <mesh key={j} position={[0, j ? -0.035 : 0.035, 0]}>
              <boxGeometry args={[0.014, j ? 0.008 : 0.014, 0.006]} />
              <meshStandardMaterial clippingPlanes={FLOOR_CLIP} ref={(m) => ledRef(index * 2 + j, m)} color="#1a1418" emissive={j ? CARAMEL : SIGNAL} emissiveIntensity={0} toneMapped={false} />
            </mesh>
          ))}
          {/* só o nome da categoria, grande o bastante para ler de longe; as tecnologias aparecem no cartão do mouse.
              No foguete o texto some (ninguém lê ali) */}
          <Text
            ref={text}
            sdfGlyphSize={128}
            font={MONO_BOLD}
            // mesma letra em todas as gavetas; nome comprido quebra em duas linhas dentro da altura da gaveta
            fontSize={0.04}
            maxWidth={0.4}
            lineHeight={1}
            position={[0.03, 0, 0.002]}
            color="#f6eae3"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.04}
          >
            {drawer.label.toUpperCase()}
          </Text>
        </group>
      )}
      {drawer && hovered && (
        <Html position={[side * (W / 2 + 0.04), 0, 0.36]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={card}
            style={{ opacity: 0, transform: side > 0 ? 'translate(0, -50%)' : 'translate(-100%, -50%)' }}
            className="w-52 rounded-lg border border-signal bg-background/90 px-3 py-2 shadow-lg backdrop-blur"
          >
            <p className="font-mono text-[10px] uppercase tracking-wide text-signal">{drawer.label}</p>
            <p className="mt-0.5 text-xs leading-snug text-foreground">{drawer.techs.join(', ')}</p>
          </div>
        </Html>
      )}
    </group>
  )
}

const STATUS: Record<string, [string, string, string]> = {
  producao: ['● EM PRODUÇÃO', '● IN PRODUCTION', SIGNAL],
  prototipo: ['◐ PROTÓTIPO', '◐ PROTOTYPE', CARAMEL],
  encerrado: ['○ ENCERRADO', '○ ARCHIVED', '#8d8489'],
}

function Rack({
  index,
  project,
  faces,
  progressRef,
  rocketRef,
  onOpen,
  en,
}: {
  index: number
  project: ServerProject
  faces: Faces
  progressRef: React.RefObject<number>
  rocketRef: React.RefObject<number>
  onOpen: (project: NonNullable<ServerProject>) => void
  en: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const slot = useRef<THREE.MeshBasicMaterial>(null)
  const bar = useRef<THREE.MeshStandardMaterial>(null)
  const screen = useRef<THREE.MeshStandardMaterial>(null)
  const nozzle = useRef<THREE.MeshStandardMaterial>(null)
  const flame = useRef<THREE.Group>(null)
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const arrive = useRef<number[]>(Array(UNITS).fill(0))
  const open = useRef(0)
  const [hover, setHover] = useState(false)
  const [hoverDrawer, setHoverDrawer] = useState<number | null>(null)
  const hoverOpen = useRef(0)
  // servidores de pé e ainda sem foguete: só aí mouse e clique fazem algo
  const engagedRef = useRef(false)
  const readableRef = useRef(true)
  const drawers = project?.drawers.slice(0, UNITS) ?? []
  // as gavetas com dados vão de baixo para cima; o resto são tampas cegas (rack de verdade também tem)
  const units: (Drawer | null)[] = Array.from({ length: UNITS }, (_, i) => drawers[i] ?? null)
  const row = { x: (index - 1.5) * SPACING, z: -Math.abs(index - 1.5) * 0.18 }
  const angle = Math.PI / 4 + (index * Math.PI) / 2

  useFrame((state, dt) => {
    const s = progressRef.current ?? 0
    const r = rocketRef.current ?? 0
    const k = easeInOut(clamp01((segment(s, RISE[0], RISE[1]) - index * 0.12) / 0.64))
    for (let i = 0; i < UNITS; i++) arrive.current[i] = clamp01((segment(s, SLOT[0], SLOT[1]) - index * 0.06 - i * 0.07) / 0.35)
    const power = project ? segment(s, POWER[0], POWER[1]) : 0
    const engaged = s >= 0.8 && r < 0.1
    engagedRef.current = engaged
    readableRef.current = r < 0.12
    hoverOpen.current += ((hover && engaged ? 1 : 0) - hoverOpen.current) * (1 - Math.exp(-dt * 6))
    // abre um pouco com a rolagem (em escada) e mais um tanto no rack sob o mouse; recolhe antes do foguete
    open.current = (easeInOut(segment(s, OPEN[0], OPEN[1])) * 0.7 + hoverOpen.current * 0.4) * (1 - segment(r, RETRACT[0], RETRACT[1]))
    const a = easeInOut(segment(r, ASSEMBLE[0], ASSEMBLE[1]))
    const lift = liftHeight(r)
    if (group.current) {
      const bx = Math.cos(angle) * BOOSTER_R
      const bz = Math.sin(angle) * BOOSTER_R
      const scale = 1 + (BOOSTER_SCALE - 1) * a
      group.current.position.set(
        THREE.MathUtils.lerp(row.x, bx, a),
        FLOOR + (H / 2) * scale - (1 - k) * (H + 0.2) + 0.25 * a + lift,
        THREE.MathUtils.lerp(row.z, bz, a)
      )
      // vira de costas para o centro (a frente com as gavetas fica para fora)
      group.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI / 2 - angle, a)
      group.current.scale.setScalar(scale)
      group.current.visible = k > 0.001
    }
    if (slot.current) slot.current.opacity = (k > 0 && k < 1 ? 0.45 * Math.sin(k * Math.PI) + 0.1 : 0.12 * power) * (1 - a)
    const t = state.clock.elapsedTime
    const glow = power * (hover && engaged ? 1.6 : 1)
    if (bar.current) bar.current.emissiveIntensity = 2.4 * glow
    if (screen.current) screen.current.emissiveIntensity = 0.5 * glow
    leds.current.forEach((m, i) => {
      if (!m) return
      const on = clamp01(power * UNITS - Math.floor(i / 2))
      const blink = 0.55 + 0.45 * Math.sin(t * (2.2 + ((i * 7 + index * 3) % 5)) + i * 1.7)
      m.emissiveIntensity = 3 * on * blink
    })
    // ignição: o bocal acende e a chama cresce, tremendo
    const ig = segment(r, IGNITE[0], IGNITE[1])
    if (nozzle.current) nozzle.current.emissiveIntensity = 3 * ig
    if (flame.current) {
      flame.current.visible = ig > 0.01
      const flick = 0.85 + 0.15 * Math.sin(t * 40 + index * 2)
      flame.current.scale.set(1, ig * flick * (1 + segment(r, LIFTOFF[0], LIFTOFF[1]) * 0.8), 1)
    }
    const labelAlpha = String(clamp01((s - 0.78) / 0.12) * (1 - clamp01(r / 0.08)))
    if (label.current) label.current.style.opacity = labelAlpha
    if (summary.current) summary.current.style.opacity = labelAlpha
  })

  const pointer = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!project || (progressRef.current ?? 0) < 0.8 || (rocketRef.current ?? 0) > 0.1) return
      e.stopPropagation()
      setHover(true)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHover(false)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!project || (progressRef.current ?? 0) < 0.8 || (rocketRef.current ?? 0) > 0.1) return
      e.stopPropagation()
      onOpen(project)
    },
  }
  const status = project?.status ? STATUS[project.status] : null

  return (
    <>
      {/* recorte aceso no chão por onde a carcaça sobe */}
      <mesh position={[row.x, FLOOR + 0.006, row.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + 0.08, D + 0.08]} />
        <meshBasicMaterial clippingPlanes={FLOOR_CLIP} ref={slot} color={SIGNAL} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={group} visible={false} {...pointer}>
        {/* carcaça aberta na frente: fundo, laterais, teto e base (as gavetas entram nela) */}
        {[
          [0, 0, -D / 2 + 0.02, W, H, 0.04],
          [-W / 2 + 0.02, 0, 0, 0.04, H, D],
          [W / 2 - 0.02, 0, 0, 0.04, H, D],
          [0, H / 2 - 0.02, 0, W, 0.04, D],
          [0, -H / 2 + 0.02, 0, W, 0.04, D],
        ].map(([x, y, z, w, h, d], i) => (
          <RBox key={i} args={[w, h, d]} radius={0.012} position={[x, y, z]}>
            <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color={METAL} metalness={0.85} roughness={0.35} />
          </RBox>
        ))}
        {/* trilhos dos slots */}
        {Array.from({ length: UNITS + 1 }, (_, i) => (
          <mesh key={i} position={[0, unitY(i) - 0.086, D / 2 - 0.03]}>
            <boxGeometry args={[W - 0.06, 0.004, 0.02]} />
            <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color="#4a3f45" metalness={1} roughness={0.3} />
          </mesh>
        ))}
        {units.map((drawer, i) => (
          <DrawerUnit
            key={i}
            index={i}
            drawer={drawer}
            faces={faces}
            arriveRef={arrive}
            openRef={open}
            ledRef={(n, m) => {
              leds.current[n] = m
            }}
            hovered={hoverDrawer === i}
            engagedRef={engagedRef}
            readableRef={readableRef}
            onHover={(n) => setHoverDrawer((cur) => (n === null && cur !== i ? cur : n))}
            side={index === 3 ? -1 : 1}
          />
        ))}
        {/* visor no alto: nome, empresa, estado e o número de destaque */}
        <group position={[0, H / 2 - 0.2, D / 2 - 0.02]}>
          <mesh>
            <planeGeometry args={[W - 0.08, 0.28]} />
            <meshStandardMaterial clippingPlanes={FLOOR_CLIP} ref={screen} color="#120e10" emissive="#2b2024" emissiveIntensity={0} toneMapped={false} />
          </mesh>
          <Text
            sdfGlyphSize={128}
            font={project ? DISPLAY : MONO}
            fontSize={project ? Math.min(0.05, (W - 0.14) / (project.title.length * 0.56)) : 0.035}
            position={[-W / 2 + 0.07, 0.085, 0.002]}
            color={project ? '#f6eae3' : '#5b4a52'}
            anchorX="left"
            anchorY="middle"
            whiteSpace="nowrap"
          >
            {project ? project.title : en ? 'free slot' : 'livre'}
          </Text>
          {project?.company && (
            <Text sdfGlyphSize={128} font={MONO} fontSize={0.02} position={[-W / 2 + 0.07, 0.04, 0.002]} color="#8d8489" anchorX="left" anchorY="middle" letterSpacing={0.08}>
              {project.company.toUpperCase()}
            </Text>
          )}
          {project?.highlight && (
            <Text
              font={DISPLAY}
              fontSize={Math.min(0.045, (W - 0.14) / (project.highlight.length * 0.55))}
              position={[-W / 2 + 0.07, -0.025, 0.002]}
              color={SIGNAL}
              anchorX="left"
              anchorY="middle"
              whiteSpace="nowrap"
            >
              {project.highlight}
            </Text>
          )}
          <Text
            sdfGlyphSize={128}
            font={MONO_BOLD}
            fontSize={0.02}
            position={[-W / 2 + 0.07, -0.09, 0.002]}
            color={project ? (status?.[2] ?? SIGNAL) : '#3d3036'}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.12}
          >
            {project ? (status ? status[en ? 1 : 0] : '● ONLINE') : '○ OFFLINE'}
          </Text>
          <Text sdfGlyphSize={128} font={MONO} fontSize={0.018} position={[W / 2 - 0.07, -0.09, 0.002]} color="#5b4a52" anchorX="right" anchorY="middle" letterSpacing={0.1}>
            {`SRV-0${index + 1}`}
          </Text>
        </group>
        <mesh position={[0, H / 2 + 0.004, D / 2 - 0.05]}>
          <boxGeometry args={[W - 0.06, 0.008, 0.02]} />
          <meshStandardMaterial clippingPlanes={FLOOR_CLIP} ref={bar} color="#3a2f35" emissive={SIGNAL} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {/* bocal de propulsor embaixo (só aparece quando vira foguete: antes fica dentro do chão) e a chama */}
        <mesh position={[0, -H / 2 - 0.12, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.24, 24, 1, true]} />
          <meshStandardMaterial clippingPlanes={FLOOR_CLIP} ref={nozzle} color="#3a2f35" emissive={SIGNAL} emissiveIntensity={0} metalness={0.9} roughness={0.3} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* a chama cresce para baixo a partir do bocal: o grupo escala e o cone fica pendurado pela base */}
        <group ref={flame} position={[0, -H / 2 - 0.24, 0]} visible={false}>
          <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.24, 1.4, 24, 1, true]} />
            <meshBasicMaterial clippingPlanes={FLOOR_CLIP} color={SIGNAL} transparent opacity={0.85} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* resumo do projeto em cima do rack (presa pela base, cresce para cima) */}
        {project?.summary && (
          <Html position={[0, H / 2 + 0.06, D / 2]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div ref={summary} style={{ opacity: 0, transform: 'translate(-50%, -100%)' }} className="hidden w-40 sm:block">
              {/* o resumo inteiro, sem cortar: pode ficar mais alto */}
              <div className="rounded-lg border border-hairline bg-background/85 px-3 py-2 shadow-lg backdrop-blur">
                <p className="text-xs leading-snug text-foreground/90">{project.summary}</p>
              </div>
            </div>
          </Html>
        )}
        {/* etiqueta clicável (também funciona por teclado e leitor de tela) */}
        <Html position={[0, -H / 2 - 0.08, D / 2]} zIndexRange={[20, 0]}>
          {/* presa pelo topo no pé do rack: a ficha cresce para baixo, sem cobrir o servidor */}
          <div ref={label} style={{ opacity: 0, transform: 'translateX(-50%)' }}>
            {project ? (
              <a
                href={project.href}
                target={project.external ? '_blank' : undefined}
                rel={project.external ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                className={`block w-[23vw] rounded-lg border bg-background/85 px-1.5 py-1 text-center shadow-lg backdrop-blur transition-colors sm:w-44 sm:px-3 sm:py-1.5 ${hover ? 'border-signal' : 'border-signal/50'}`}
              >
                <span className="line-clamp-2 block font-display text-[11px] font-medium leading-tight text-foreground sm:text-sm">{project.title}</span>
                {/* estado e número em texto de verdade (o 3D de longe é pequeno); as tecnologias ficam nas gavetas */}
                {(status || project.highlight) && (
                  <span className="mt-0.5 hidden font-mono text-[10px] sm:block" style={{ color: status?.[2] ?? SIGNAL }}>
                    {[status?.[en ? 1 : 0].slice(2).toLowerCase(), project.highlight].filter(Boolean).join(' · ')}
                  </span>
                )}
                <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-wide text-signal sm:block">
                  {en ? 'open project →' : 'abrir projeto →'}
                </span>
              </a>
            ) : (
              <div className="w-[23vw] rounded-lg border border-hairline bg-background/60 px-1.5 py-1 text-center backdrop-blur sm:w-44 sm:px-3 sm:py-1.5">
                <span className="block font-mono text-[10px] uppercase tracking-wide text-steel">{en ? 'server off' : 'servidor desligado'}</span>
              </div>
            )}
          </div>
        </Html>
      </group>
    </>
  )
}

// corpo central do foguete: sobe do chão no meio dos racks, com janelas, faixas acesas, ponta e a chama principal
function RocketCore({ rocketRef }: { rocketRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null)
  const flame = useRef<THREE.Group>(null)
  const exhaust = useRef<THREE.Points>(null)
  const exhaustMat = useRef<THREE.PointsMaterial>(null)
  const geometry = useMemo(() => {
    const random = seeded(11)
    const pos = new Float32Array(260 * 3)
    for (let i = 0; i < 260; i++) {
      pos[i * 3] = (random() - 0.5) * 0.5
      pos[i * 3 + 1] = -random() * 3
      pos[i * 3 + 2] = (random() - 0.5) * 0.5
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((state) => {
    const r = rocketRef.current ?? 0
    const a = easeInOut(segment(r, ASSEMBLE[0] + 0.1, ASSEMBLE[1]))
    if (group.current) {
      group.current.visible = a > 0.001
      group.current.position.y = FLOOR - 3.6 + a * 3.6 + 0.25 * a + liftHeight(r)
    }
    const t = state.clock.elapsedTime
    const ig = segment(r, IGNITE[0], IGNITE[1])
    if (flame.current) {
      flame.current.visible = ig > 0.01
      flame.current.scale.set(1, ig * (0.9 + 0.1 * Math.sin(t * 45)) * (1 + segment(r, LIFTOFF[0], LIFTOFF[1]) * 1), 1)
    }
    // faíscas descendo do bocal: a nuvem inteira escorre e volta ao topo (sem mexer em cada ponto)
    if (exhaust.current) {
      exhaust.current.visible = ig > 0.01
      exhaust.current.position.y = -0.5 - ((t * 2.2) % 1) * 1.2
      exhaust.current.scale.set(1 + ig, 1 + segment(r, LIFTOFF[0], LIFTOFF[1]), 1 + ig)
    }
    if (exhaustMat.current) exhaustMat.current.opacity = 0.75 * ig
  })
  return (
    <group ref={group} visible={false}>
      {/* corpo: cilindro metálico com faixas e janelas (o "núcleo" que junta os projetos) */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 2.8, 48]} />
        <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color="#3a2f37" metalness={0.85} roughness={0.32} />
      </mesh>
      {[0.2, 1.4, 2.4].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.445, 0.012, 8, 64]} />
          <Glow intensity={2.4} />
        </mesh>
      ))}
      {[1.9, 1.55].map((y) => (
        <mesh key={y} position={[0, y, 0.44]}>
          <circleGeometry args={[0.07, 32]} />
          <Glow color="#f6eae3" intensity={1.4} />
        </mesh>
      ))}
      <Text sdfGlyphSize={128} font={MONO_BOLD} fontSize={0.09} position={[0, 0.85, 0.452]} color={SIGNAL} anchorX="center" anchorY="middle" letterSpacing={0.18}>
        FZR
      </Text>
      {/* ponta */}
      <mesh position={[0, 3.05, 0]}>
        <coneGeometry args={[0.42, 0.9, 48]} />
        <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color="#2f2530" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.52, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <Glow intensity={4} />
      </mesh>
      {/* bocal principal, a chama (pendurada pela base) e as faíscas */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.3, 0.42, 0.28, 32, 1, true]} />
        <meshStandardMaterial clippingPlanes={FLOOR_CLIP} color="#2a2126" emissive={SIGNAL} emissiveIntensity={1.2} metalness={0.9} roughness={0.3} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={flame} position={[0, -0.46, 0]} visible={false}>
        <mesh position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.34, 1.8, 32, 1, true]} />
          <meshBasicMaterial clippingPlanes={FLOOR_CLIP} color="#ffb070" transparent opacity={0.8} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <points ref={exhaust} geometry={geometry} visible={false}>
        <pointsMaterial clippingPlanes={FLOOR_CLIP} ref={exhaustMat} color={CARAMEL} size={0.06} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

/**
 * Capítulo 04 e o final: os racks (um por projeto da home) sobem do chão, recebem as gavetas, ligam e abrem um pouco
 * (`progressRef` 0..1); depois viram os propulsores de um foguete que decola (`rocketRef` 0..1).
 */
export function Servers({
  servers,
  progressRef,
  rocketRef,
  onOpen,
  en,
}: {
  servers: ServerProject[]
  progressRef: React.RefObject<number>
  rocketRef: React.RefObject<number>
  onOpen: (project: NonNullable<ServerProject>) => void
  en: boolean
}) {
  const faces = useMemo(() => ({ full: faceplateTexture(false), blank: faceplateTexture(true) }), [])
  return (
    <group>
      {servers.map((project, i) => (
        <Rack key={i} index={i} project={project} faces={faces} progressRef={progressRef} rocketRef={rocketRef} onOpen={onOpen} en={en} />
      ))}
      <RocketCore rocketRef={rocketRef} />
    </group>
  )
}
