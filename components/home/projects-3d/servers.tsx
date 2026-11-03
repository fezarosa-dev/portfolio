'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { CARAMEL, clamp01, DISPLAY, easeInOut, METAL, MONO, MONO_BOLD, SIGNAL } from './scene-kit'

/** Um servidor por projeto da home; null = servidor desligado (sem projeto). */
export type ServerProject = { title: string; company: string | null; href: string; external: boolean } | null

// medidas do rack (o chão da plataforma fica em y = -1,12)
const W = 0.7
const H = 1.9
const D = 0.8
const FLOOR = -1.12
const UNITS = 8
const SPACING = 0.95
// cada rack sobe na sua vez: atraso por índice, dentro do trecho de subida (0..1)
const STAGGER = 0.14

// frente de uma gaveta 2U: baias de disco, grade de ventilação e puxadores (desenhada uma vez, compartilhada)
function faceplateTexture() {
  const w = 512
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#211a1e'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#2d2429'
  ctx.fillRect(0, 0, w, 6)
  ctx.fillRect(0, h - 6, w, 6)
  // seis baias de disco com trava
  for (let i = 0; i < 6; i++) {
    const x = 70 + i * 52
    ctx.fillStyle = '#151013'
    ctx.fillRect(x, 22, 44, 84)
    ctx.fillStyle = '#3a2f35'
    ctx.fillRect(x + 4, 92, 36, 8)
    for (let y = 30; y < 86; y += 7) {
      ctx.fillStyle = '#2b2227'
      ctx.fillRect(x + 6, y, 32, 3)
    }
  }
  // grade de ventilação à direita
  for (let y = 24; y < 104; y += 9)
    for (let x = 400; x < 470; x += 9) {
      ctx.fillStyle = '#0e0a0c'
      ctx.fillRect(x, y, 5, 5)
    }
  // puxadores nas pontas
  ctx.fillStyle = '#4a3f45'
  ctx.fillRect(10, 30, 14, 68)
  ctx.fillRect(w - 24, 30, 14, 68)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function Rack({
  index,
  project,
  face,
  progressRef,
  onOpen,
  en,
}: {
  index: number
  project: ServerProject
  face: THREE.Texture
  progressRef: React.RefObject<number>
  onOpen: (project: NonNullable<ServerProject>) => void
  en: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const slot = useRef<THREE.MeshBasicMaterial>(null)
  const [hover, setHover] = useState(false)
  // materiais próprios do rack: as luzes ligam com a subida e os LEDs piscam cada um no seu ritmo
  const bar = useRef<THREE.MeshStandardMaterial>(null)
  const screen = useRef<THREE.MeshStandardMaterial>(null)
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const lift = useRef(0)
  const x = (index - 1.5) * SPACING
  const z = -Math.abs(index - 1.5) * 0.18

  useFrame((state, dt) => {
    const s = progressRef.current ?? 0
    const k = easeInOut(clamp01((s - index * STAGGER) / (1 - 3 * STAGGER)))
    // liga depois de encostar no chão, gaveta por gaveta de baixo para cima
    const power = project ? clamp01((s - index * STAGGER - (1 - 3 * STAGGER)) / 0.12) : 0
    lift.current += ((hover && project ? 0.06 : 0) - lift.current) * (1 - Math.exp(-dt * 8))
    if (group.current) {
      group.current.position.set(x, FLOOR + H / 2 - (1 - k) * (H + 0.2), z + lift.current)
      group.current.visible = k > 0.001
    }
    // o recorte acende enquanto o rack passa por ele e fica só um contorno fraco depois
    if (slot.current) slot.current.opacity = k > 0 && k < 1 ? 0.45 * Math.sin(k * Math.PI) + 0.1 : 0.12 * power
    const t = state.clock.elapsedTime
    const glow = power * (hover ? 1.6 : 1)
    if (bar.current) bar.current.emissiveIntensity = 2.4 * glow
    if (screen.current) screen.current.emissiveIntensity = 0.5 * glow
    leds.current.forEach((m, i) => {
      if (!m) return
      // dois LEDs por gaveta (i par e ímpar); acendem de baixo para cima
      const on = clamp01(power * UNITS - Math.floor(i / 2))
      const blink = 0.55 + 0.45 * Math.sin(t * (2.2 + ((i * 7 + index * 3) % 5)) + i * 1.7)
      m.emissiveIntensity = 3 * on * blink * (hover ? 1.4 : 1)
    })
    if (label.current) label.current.style.opacity = String(clamp01((s - 0.8) / 0.2))
  })

  const pointer = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!project || (progressRef.current ?? 0) < 0.8) return
      e.stopPropagation()
      setHover(true)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHover(false)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!project || (progressRef.current ?? 0) < 0.8) return
      e.stopPropagation()
      onOpen(project)
    },
  }

  return (
    <>
      {/* recorte aceso no chão por onde o rack sobe */}
      <mesh position={[x, FLOOR + 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + 0.08, D + 0.08]} />
        <meshBasicMaterial ref={slot} color={SIGNAL} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={group} visible={false} {...pointer}>
        <RoundedBox args={[W, H, D]} radius={0.02}>
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.35} />
        </RoundedBox>
        {/* gavetas 2U com LED de status */}
        {Array.from({ length: UNITS }, (_, i) => {
          const y = -H / 2 + 0.16 + i * 0.172
          return (
            <group key={i} position={[0, y, D / 2 + 0.004]}>
              <mesh>
                <planeGeometry args={[W - 0.08, 0.15]} />
                <meshStandardMaterial map={face} metalness={0.5} roughness={0.5} />
              </mesh>
              {[0, 1].map((j) => (
                <mesh key={j} position={[-W / 2 + 0.07, j ? -0.01 : 0.035, 0.003]}>
                  <boxGeometry args={[0.018, j ? 0.008 : 0.018, 0.006]} />
                  <meshStandardMaterial
                    ref={(m) => {
                      leds.current[i * 2 + j] = m
                    }}
                    color="#1a1418"
                    emissive={(i + j) % 3 === 2 ? CARAMEL : SIGNAL}
                    emissiveIntensity={0}
                    toneMapped={false}
                  />
                </mesh>
              ))}
            </group>
          )
        })}
        {/* visor no alto: nome do projeto e estado */}
        <group position={[0, H / 2 - 0.13, D / 2 + 0.006]}>
          <mesh>
            <planeGeometry args={[W - 0.08, 0.16]} />
            <meshStandardMaterial ref={screen} color="#120e10" emissive="#2b2024" emissiveIntensity={0} toneMapped={false} />
          </mesh>
          <Text
            font={project ? DISPLAY : MONO}
            // uma linha só: nome comprido diminui a letra para caber no visor
            fontSize={project ? Math.min(0.05, (W - 0.14) / (project.title.length * 0.56)) : 0.035}
            position={[-W / 2 + 0.07, 0.022, 0.002]}
            color={project ? '#f6eae3' : '#5b4a52'}
            anchorX="left"
            anchorY="middle"
            whiteSpace="nowrap"
          >
            {project ? project.title : en ? 'free slot' : 'livre'}
          </Text>
          <Text font={MONO_BOLD} fontSize={0.024} position={[-W / 2 + 0.07, -0.038, 0.002]} color={project ? SIGNAL : '#3d3036'} anchorX="left" anchorY="middle" letterSpacing={0.12}>
            {project ? '● ONLINE' : '○ OFFLINE'}
          </Text>
          <Text font={MONO} fontSize={0.02} position={[W / 2 - 0.07, -0.038, 0.002]} color="#5b4a52" anchorX="right" anchorY="middle" letterSpacing={0.1}>
            {`SRV-0${index + 1}`}
          </Text>
        </group>
        {/* barra de luz no topo (apagada quando o servidor está desligado) */}
        <mesh position={[0, H / 2 + 0.004, D / 2 - 0.05]}>
          <boxGeometry args={[W - 0.06, 0.008, 0.02]} />
          <meshStandardMaterial ref={bar} color="#3a2f35" emissive={SIGNAL} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {/* etiqueta clicável (também funciona por teclado e leitor de tela) */}
        <Html position={[0, -H / 2 - 0.16, D / 2]} center zIndexRange={[20, 0]}>
          <div ref={label} style={{ opacity: 0 }}>
            {project ? (
              <a
                href={project.href}
                target={project.external ? '_blank' : undefined}
                rel={project.external ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                className={`block w-[23vw] rounded-lg border bg-background/85 px-1.5 py-1 sm:w-44 sm:px-3 sm:py-1.5 text-center shadow-lg backdrop-blur transition-colors ${hover ? 'border-signal' : 'border-signal/50'}`}
              >
                <span className="line-clamp-2 block font-display text-[11px] font-medium leading-tight text-foreground sm:text-sm">{project.title}</span>
                <span className="hidden font-mono text-[10px] uppercase tracking-wide text-signal sm:block">
                  {en ? 'open project →' : 'abrir projeto →'}
                </span>
              </a>
            ) : (
              <div className="w-[23vw] rounded-lg border border-hairline bg-background/60 px-1.5 py-1 sm:w-44 sm:px-3 sm:py-1.5 text-center backdrop-blur">
                <span className="block font-mono text-[10px] uppercase tracking-wide text-steel">
                  {en ? 'server off' : 'servidor desligado'}
                </span>
              </div>
            )}
          </div>
        </Html>
      </group>
    </>
  )
}

/** Os quatro racks que sobem do chão no capítulo 04. `progressRef` vai de 0 (embaixo do chão) a 1 (todos de pé). */
export function Servers({
  servers,
  progressRef,
  onOpen,
  en,
}: {
  servers: ServerProject[]
  progressRef: React.RefObject<number>
  onOpen: (project: NonNullable<ServerProject>) => void
  en: boolean
}) {
  const face = useMemo(() => faceplateTexture(), [])
  return (
    <group>
      {servers.map((project, i) => (
        <Rack key={i} index={i} project={project} face={face} progressRef={progressRef} onOpen={onOpen} en={en} />
      ))}
    </group>
  )
}
