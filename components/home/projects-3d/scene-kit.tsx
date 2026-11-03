'use client'

import type { ThreeElements } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// peças comuns às cenas 3D da home (o PC e os servidores): paleta, fontes, contas da rolagem e material aceso
export const SIGNAL = '#f2661d'
export const CARAMEL = '#b0775a'
export const METAL = '#2f2530'
export const GOLD = '#c99a4b'
export const MONO_BOLD = '/fonts/3d/plex-mono-700.woff'
export const MONO = '/fonts/3d/plex-mono-400.woff'
export const DISPLAY = '/fonts/3d/space-grotesk-700.woff'

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const segment = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// gerador com semente: texturas e poeira saem iguais em todo render (e o render continua puro)
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


export function Glow({ color = SIGNAL, intensity = 3 }: { color?: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
}

export type Vec3 = [number, number, number]

// caixa arredondada barata: a geometria do three (normais calculadas direto, sem o "creased normals" do drei, que
// pesava na abertura) e uma só por tamanho, compartilhada entre todas as peças iguais
const boxes = new Map<string, RoundedBoxGeometry>()
function roundedBox(w: number, h: number, d: number, radius: number, segments: number) {
  const key = `${w}|${h}|${d}|${radius}|${segments}`
  let g = boxes.get(key)
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, w / 2, h / 2, d / 2))
    boxes.set(key, g)
  }
  return g
}

export function RBox({
  args,
  radius = 0.05,
  smoothness = 2,
  children,
  ...props
}: { args: [number, number, number]; radius?: number; smoothness?: number } & Omit<ThreeElements['mesh'], 'args'>) {
  return (
    <mesh geometry={roundedBox(args[0], args[1], args[2], radius, smoothness)} {...props}>
      {children}
    </mesh>
  )
}
