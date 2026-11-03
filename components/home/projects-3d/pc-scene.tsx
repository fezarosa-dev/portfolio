'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'

// Cena 3D da home: um PC que se desmonta conforme a rolagem (vista explodida, cada peça com uma tecnologia).
// A rolagem chega como progresso 0..1 da seção fixa; a cena só lê esse número a cada quadro (sem re-render).

const SIGNAL = '#f2661d'
const CARAMEL = '#b0775a'
const METAL = '#2f2530'
const PCB = '#1c1820'

export const STORY = {
  // trechos da rolagem (0..1): parado/girando, desmontando, desmontado com as etiquetas
  explodeStart: 0.18,
  explodeEnd: 0.62,
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const segment = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
// gerador com semente: a poeira sai igual em todo render (e o render continua puro)
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

type Vec3 = [number, number, number]

function lidTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 512, 512)
  g.addColorStop(0, '#c9c2c6')
  g.addColorStop(1, '#8d8489')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 3) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`
    ctx.fillRect(0, y, 512, 1)
  }
  ctx.fillStyle = '#3a2c33'
  ctx.font = 'bold 54px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('zanoni', 256, 236)
  ctx.fillStyle = SIGNAL
  ctx.fillText('.dev.br', 256, 300)
  ctx.font = '22px ui-monospace, monospace'
  ctx.fillStyle = '#5b4a52'
  ctx.fillText('FZR-01 · ENGINEERED', 256, 360)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function pcbTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = PCB
  ctx.fillRect(0, 0, 1024, 1024)
  ctx.strokeStyle = 'rgba(242,102,29,0.55)'
  ctx.lineWidth = 3
  for (let i = 0; i < 70; i++) {
    let x = Math.random() * 1024
    let y = Math.random() * 1024
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let s = 0; s < 4; s++) {
      if (Math.random() > 0.5) x += (Math.random() - 0.5) * 300
      else y += (Math.random() - 0.5) * 300
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = 'rgba(242,102,29,0.8)'
    ctx.fillRect(x - 4, y - 4, 8, 8)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Fan({ radius = 0.28 }: { radius?: number }) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 6
  })
  return (
    <group>
      <mesh>
        <torusGeometry args={[radius, 0.025, 12, 48]} />
        <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <group ref={blades}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0.35, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.04, radius * 1.7, 0.01]} />
            <meshStandardMaterial color="#1a1418" metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
          <meshStandardMaterial color="#120e11" />
        </mesh>
      </group>
    </group>
  )
}

// placas do gabinete: onde ficam montadas e para onde vão na vista explodida
const SHELL: { key: string; at: Vec3; size: Vec3; out: Vec3 }[] = [
  { key: 'back', at: [0, 0, -0.5], size: [2.0, 2.15, 0.06], out: [0, 0, -1.6] },
  { key: 'top', at: [0, 1.05, 0], size: [2.0, 0.06, 1.06], out: [0, 1.5, 0] },
  { key: 'bottom', at: [0, -1.05, 0], size: [2.0, 0.06, 1.06], out: [0, -0.35, 0] },
  { key: 'left', at: [-1.0, 0, 0], size: [0.05, 2.15, 1.06], out: [-1.5, 0, 0] },
  { key: 'front', at: [1.0, 0, 0], size: [0.05, 2.15, 1.06], out: [2.3, 0, 0] },
]

type Part = {
  key: string
  name: string
  assembled: Vec3
  offset: Vec3
  labelOffset?: Vec3
  node: React.ReactNode
}

function Pc({ progressRef, labels }: { progressRef: React.RefObject<number>; labels: string[] }) {
  const lid = useMemo(() => lidTexture(), [])
  const pcb = useMemo(() => pcbTexture(), [])
  const root = useRef<THREE.Group>(null)
  const glass = useRef<THREE.Mesh>(null)
  const partRefs = useRef<Record<string, THREE.Group | null>>({})
  const shellRefs = useRef<Record<string, THREE.Group | null>>({})
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const parts: Part[] = useMemo(
    () => [
      {
        key: 'board',
        name: 'Placa-mãe',
        assembled: [0, 0.05, -0.42],
        offset: [0, 0.1, -1.1],
        node: (
          <mesh>
            <boxGeometry args={[1.55, 1.75, 0.05]} />
            <meshStandardMaterial map={pcb} roughness={0.7} metalness={0.2} emissive={SIGNAL} emissiveMap={pcb} emissiveIntensity={0.35} />
          </mesh>
        ),
      },
      {
        key: 'cpu',
        name: 'Processador',
        assembled: [0.12, 0.42, -0.36],
        offset: [0.2, 0.75, 1.5],
        node: (
          <group>
            <mesh>
              <boxGeometry args={[0.42, 0.42, 0.05]} />
              <meshStandardMaterial color="#1d4a3a" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.34, 0.34, 0.04]} />
              <meshStandardMaterial map={lid} metalness={0.85} roughness={0.32} />
            </mesh>
          </group>
        ),
      },
      ...[0, 1, 2, 3].map<Part>((i) => ({
        key: `ram${i}`,
        name: 'Memória',
        assembled: [0.5 + i * 0.075, 0.42, -0.3],
        offset: [0.35 + i * 0.28, 1.15, 0.9],
        node: (
          <group>
            <mesh>
              <boxGeometry args={[0.035, 0.62, 0.11]} />
              <meshStandardMaterial color="#251c22" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.33, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.115]} />
              <meshStandardMaterial color={i % 2 ? CARAMEL : SIGNAL} emissive={i % 2 ? CARAMEL : SIGNAL} emissiveIntensity={2} toneMapped={false} />
            </mesh>
          </group>
        ),
      })),
      {
        key: 'gpu',
        name: 'Placa de vídeo',
        assembled: [-0.05, -0.2, -0.12],
        offset: [0.15, -0.35, 1.45],
        node: (
          <group>
            <RoundedBox args={[1.25, 0.16, 0.5]} radius={0.03}>
              <meshStandardMaterial color="#231b21" metalness={0.75} roughness={0.3} />
            </RoundedBox>
            {[-0.33, 0.33].map((x) => (
              <group key={x} position={[x, -0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <Fan radius={0.17} />
              </group>
            ))}
            <mesh position={[0, 0.085, 0.24]}>
              <boxGeometry args={[1.1, 0.012, 0.02]} />
              <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
          </group>
        ),
      },
      {
        key: 'psu',
        name: 'Fonte',
        assembled: [-0.15, -0.86, 0],
        offset: [-0.2, -1.05, 0.7],
        node: (
          <RoundedBox args={[1.0, 0.32, 0.75]} radius={0.03}>
            <meshStandardMaterial color="#1b1519" metalness={0.5} roughness={0.5} />
          </RoundedBox>
        ),
      },
      ...[0.55, 0, -0.55].map<Part>((y, i) => ({
        key: `fan${i}`,
        name: 'Ventoinha',
        assembled: [0.92, y + 0.15, 0],
        offset: [1.6, (1 - i) * 0.45, 0.5],
        node: (
          <group rotation={[0, Math.PI / 2, 0]}>
            <Fan />
          </group>
        ),
      })),
    ],
    [lid, pcb]
  )

  // cada etiqueta recebe uma tecnologia (a ordem da home); peças sem tecnologia mostram só o nome
  const labelled = parts.filter((p) => !p.key.startsWith('ram') || p.key === 'ram0').filter((p) => !p.key.startsWith('fan') || p.key === 'fan1')
  const techOf = Object.fromEntries(labelled.map((p, i) => [p.key, labels[i]]))

  useFrame((state, dt) => {
    const p = progressRef.current ?? 0
    const e = easeInOut(segment(p, STORY.explodeStart, STORY.explodeEnd))
    if (root.current) {
      // gira para mostrar o lado de vidro e continua girando devagar sozinho
      root.current.rotation.y = -0.55 + e * 0.75 + Math.sin(state.clock.elapsedTime * 0.25) * 0.06
      root.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03
    }
    for (const part of parts) {
      const g = partRefs.current[part.key]
      if (!g) continue
      g.position.set(
        part.assembled[0] + part.offset[0] * e,
        part.assembled[1] + part.offset[1] * e,
        part.assembled[2] + part.offset[2] * e
      )
      g.rotation.x = part.key === 'gpu' ? -e * 0.5 : 0
    }
    for (const panel of SHELL) {
      const g = shellRefs.current[panel.key]
      if (g) g.position.set(panel.at[0] + panel.out[0] * e, panel.at[1] + panel.out[1] * e, panel.at[2] + panel.out[2] * e)
    }
    if (glass.current) {
      glass.current.position.z = 0.51 + e * 2.2
      glass.current.position.x = e * 0.9
      ;(glass.current.material as THREE.MeshPhysicalMaterial).opacity = 0.22 * (1 - e)
    }
    const labelAlpha = clamp01((e - 0.75) / 0.25)
    for (const key in labelRefs.current) {
      const el = labelRefs.current[key]
      if (el) el.style.opacity = String(labelAlpha)
    }
    // a câmera recua um pouco para caber a vista explodida
    const cam = state.camera
    cam.position.lerp(new THREE.Vector3(3.1 - e * 0.3, 1.0 + e * 0.6, 5.3 + e * 3.2), 1 - Math.exp(-dt * 4))
    cam.lookAt(0, -0.05 + e * 0.3, 0)
  })

  return (
    <group ref={root}>
      {/* gabinete: cada placa sai para o seu lado na desmontagem (vista explodida); o vidro sai pela frente */}
      {SHELL.map((panel) => (
        <group key={panel.key} ref={(g) => { shellRefs.current[panel.key] = g }} position={panel.at}>
          <RoundedBox args={panel.size} radius={0.02}>
            <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.32} />
          </RoundedBox>
          {panel.key === 'bottom' && (
            <mesh position={[0, 0.03, 0.53]}>
              <boxGeometry args={[2.0, 0.015, 0.015]} />
              <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={3} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
      <mesh ref={glass} position={[0, 0, 0.51]}>
        <boxGeometry args={[1.96, 2.1, 0.02]} />
        <meshPhysicalMaterial color="#d9c7cf" transparent opacity={0.22} roughness={0.05} metalness={0.1} />
      </mesh>
      {parts.map((part) => (
        <group key={part.key} ref={(g) => { partRefs.current[part.key] = g }} position={part.assembled}>
          {part.node}
          {part.key in techOf && (
            <Html position={[0, 0.32, 0.1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => { labelRefs.current[part.key] = el }}
                style={{ opacity: 0 }}
                className="whitespace-nowrap rounded-full border border-signal/50 bg-background/80 px-2.5 py-1 font-mono text-[11px] text-foreground shadow-lg backdrop-blur"
              >
                <span className="text-steel">{part.name}</span>
                {techOf[part.key] && <span className="text-signal"> · {techOf[part.key]}</span>}
              </div>
            </Html>
          )}
        </group>
      ))}
      <pointLight position={[0.2, 0.2, 0]} intensity={4} distance={3} color={SIGNAL} />
    </group>
  )
}

function Platform() {
  return (
    <group position={[0, -1.12, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial color="#241b20" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.32, 2.4, 96]} />
        <meshBasicMaterial color={SIGNAL} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.5, 1.52, 96]} />
        <meshBasicMaterial color={CARAMEL} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function Dust() {
  const geometry = useMemo(() => {
    const n = 900
    const random = seeded(7)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 6 + random() * 22
      const t = random() * Math.PI * 2
      const ph = Math.acos(2 * random() - 1)
      pos.set([r * Math.sin(ph) * Math.cos(t), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(t)], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#f6eae3" size={0.035} sizeAttenuation transparent opacity={0.7} />
    </points>
  )
}

// a rolagem chega a cada 1/60 s em degraus; a cena persegue o valor com atraso suave
function SmoothedProgress({ source, targetRef }: { source: MotionValue<number>; targetRef: React.RefObject<number> }) {
  const invalidate = useThree((s) => s.invalidate)
  useFrame((_, dt) => {
    const goal = source.get()
    targetRef.current += (goal - targetRef.current) * (1 - Math.exp(-dt * 7))
    if (Math.abs(goal - targetRef.current) > 1e-4) invalidate()
  })
  return null
}

export default function PcScene({
  progress,
  labels,
  active,
}: {
  progress: MotionValue<number>
  labels: string[]
  active: boolean
}) {
  const smoothed = useRef(progress.get())
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [3.1, 1.0, 5.3], fov: 38 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <color attach="background" args={['#2b2024']} />
      <fog attach="fog" args={['#2b2024', 9, 26]} />
      <hemisphereLight args={['#f6eae3', '#2b2024', 0.6]} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff1e6" />
      <directionalLight position={[-5, 2, -4]} intensity={1.2} color={CARAMEL} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} color="#fff1e6" position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color={SIGNAL} position={[-4, 1, -2]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={1.2} color={CARAMEL} position={[4, 0, 2]} scale={2} />
      </Environment>
      <SmoothedProgress source={progress} targetRef={smoothed} />
      <Pc progressRef={smoothed} labels={labels} />
      <Platform />
      <Dust />
    </Canvas>
  )
}
