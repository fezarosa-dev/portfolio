'use client'

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
