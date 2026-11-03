'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Html, Lightformer, RoundedBox, Text } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import { Servers, type ServerProject } from './servers'
import { CARAMEL, clamp01, DISPLAY, easeInOut, Glow, GOLD, METAL, MONO, MONO_BOLD, seeded, segment, SIGNAL, type Vec3 } from './scene-kit'

// Cena 3D da home: um PC que se desmonta conforme a rolagem (vista explodida) e a câmera mergulha no processador.
// Cada peça representa uma parte do jeito de trabalhar (a fonte é a arquitetura da solução, a base de tudo).
// A rolagem chega como progresso 0..1 da seção fixa; a cena só lê esse número a cada quadro (sem re-render).


export const STORY = {
  // trechos da rolagem (0..1): parado/girando, desmontando, desmontado com as etiquetas, mergulho no processador,
  // corte (a tela escurece e a cena troca) e os servidores subindo do chão
  explodeStart: 0.08,
  explodeEnd: 0.3,
  diveStart: 0.36,
  diveEnd: 0.62,
  cut: 0.66,
  serversStart: 0.7,
  serversEnd: 0.9,
}

const FLOOR_CLIP = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.125)]
const NO_CLIP: THREE.Plane[] = []

export type SceneStats = { projects: number; technologies: number; companies: number }

// o que cada peça representa (pt, en)
const MEANING: Record<string, { name: [string, string]; concept: [string, string] }> = {
  psu: { name: ['Fonte', 'Power supply'], concept: ['Arquitetura da solução', 'Solution architecture'] },
  ram0: { name: ['Memória', 'Memory'], concept: ['Entendimento das necessidades', 'Understanding the needs'] },
  gpu: { name: ['Placa de vídeo', 'Graphics card'], concept: ['IA aplicada', 'Applied AI'] },
  cpu: { name: ['Processador', 'Processor'], concept: ['Código', 'Code'] },
  board: { name: ['Placa-mãe', 'Motherboard'], concept: ['Integração de sistemas', 'Systems integration'] },
  fan1: { name: ['Ventoinhas', 'Fans'], concept: ['Qualidade e testes', 'Quality & testing'] },
  nvme: { name: ['SSD NVMe', 'NVMe SSD'], concept: ['Banco de dados', 'Databases'] },
  // o gabinete guarda todas as outras peças: é a solução inteira
  case: { name: ['Gabinete', 'Case'], concept: ['A solução completa', 'The complete solution'] },
  hdd0: { name: ['HDs', 'Hard drives'], concept: ['Nenhum dado se perde', 'No data ever lost'] },
}



// metal escovado em alta resolução (a tampa do processador enche a tela no mergulho)
function brushedTexture() {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, '#d6cfd3')
  g.addColorStop(0.5, '#b9b0b5')
  g.addColorStop(1, '#988e94')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const random = seeded(3)
  for (let y = 0; y < size; y++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? '255,255,255' : '40,30,36'},${random() * 0.06})`
    ctx.fillRect(0, y, size, 1)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  // nítida também vista de lado (o three limita ao máximo que a placa de vídeo aceita)
  tex.anisotropy = 16
  return tex
}

function pcbTexture() {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1a1520'
  ctx.fillRect(0, 0, size, size)
  const random = seeded(11)
  ctx.lineCap = 'round'
  for (let i = 0; i < 160; i++) {
    let x = random() * size
    let y = random() * size
    ctx.strokeStyle = random() > 0.7 ? 'rgba(242,102,29,0.75)' : 'rgba(176,119,90,0.45)'
    ctx.lineWidth = 2 + random() * 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let s = 0; s < 5; s++) {
      // trilhas em 0°/45°/90°, como numa placa de verdade
      const len = 40 + random() * 260
      const dir = Math.floor(random() * 4)
      if (dir === 0) x += len
      else if (dir === 1) y += len
      else if (dir === 2) { x += len * 0.7; y += len * 0.7 }
      else { x -= len * 0.7; y += len * 0.7 }
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  // nítida também vista de lado (o three limita ao máximo que a placa de vídeo aceita)
  tex.anisotropy = 16
  return tex
}


// ventoinha de 120 mm: moldura quadrada com parafusos, anel de luz e pás inclinadas no próprio eixo,
// girando presas ao aro (o eixo é o z local)
function Fan({ size = 0.56 }: { size?: number }) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z -= dt * 7
  })
  const r = size * 0.44
  const bar = size * 0.08
  return (
    <group>
      {[
        [0, size / 2 - bar / 2, size, bar],
        [0, -size / 2 + bar / 2, size, bar],
        [size / 2 - bar / 2, 0, bar, size],
        [-size / 2 + bar / 2, 0, bar, size],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[w, h, 0.05]} />
          <meshStandardMaterial color="#1c161a" metalness={0.3} roughness={0.55} />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh key={`${sx}${sy}`} position={[sx * (size / 2 - bar / 2), sy * (size / 2 - bar / 2), 0.027]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
            <meshStandardMaterial color="#8d8489" metalness={1} roughness={0.25} />
          </mesh>
        ))
      )}
      <mesh>
        <torusGeometry args={[r + 0.012, 0.01, 12, 64]} />
        <Glow intensity={2.4} />
      </mesh>
      <group ref={blades}>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i / 9) * Math.PI * 2]}>
            <mesh position={[0, r * 0.55, 0]} rotation={[0, 0.5, 0.18]}>
              <boxGeometry args={[r * 0.42, r * 0.78, 0.006]} />
              <meshStandardMaterial color="#241c21" metalness={0.2} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.3, r * 0.3, 0.04, 32]} />
          <meshStandardMaterial color="#1a1418" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.021]}>
          <circleGeometry args={[r * 0.12, 32]} />
          <Glow intensity={1.6} />
        </mesh>
      </group>
    </group>
  )
}

function Board({ pcb }: { pcb: THREE.Texture }) {
  const caps = useMemo(() => {
    const random = seeded(23)
    return Array.from({ length: 14 }, () => [-0.45 + random() * 0.95, 0.05 + random() * 0.7] as [number, number])
  }, [])
  return (
    <group>
      <RoundedBox args={[1.55, 1.75, 0.04]} radius={0.01}>
        <meshStandardMaterial map={pcb} roughness={0.65} metalness={0.25} />
      </RoundedBox>
      {/* soquete do processador */}
      <mesh position={[0.12, 0.37, 0.03]}>
        <boxGeometry args={[0.52, 0.52, 0.02]} />
        <meshStandardMaterial color="#3a2e35" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* slots das memórias, com travas caramelo */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0.5 + i * 0.075, 0.37, 0.035]}>
          <mesh>
            <boxGeometry args={[0.024, 0.68, 0.03]} />
            <meshStandardMaterial color="#141016" roughness={0.6} />
          </mesh>
          {[-0.35, 0.35].map((y) => (
            <mesh key={y} position={[0, y, 0.005]}>
              <boxGeometry args={[0.03, 0.03, 0.04]} />
              <meshStandardMaterial color={CARAMEL} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* slots PCIe (o primeiro com reforço de metal) */}
      {[-0.27, -0.55].map((y, i) => (
        <group key={y} position={[-0.05, y, 0.035]}>
          <mesh>
            <boxGeometry args={[1.05, 0.035, 0.03]} />
            <meshStandardMaterial color={i === 0 ? '#9a9196' : '#141016'} metalness={i === 0 ? 1 : 0} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {/* dissipadores dos VRMs com aletas e filete de luz */}
      {[
        { at: [-0.25, 0.38, 0.06] as Vec3, size: [0.14, 0.46, 0.08] as Vec3, finsAlong: 'y' },
        { at: [0.12, 0.72, 0.06] as Vec3, size: [0.46, 0.12, 0.08] as Vec3, finsAlong: 'x' },
      ].map((h, k) => (
        <group key={k} position={h.at}>
          <RoundedBox args={h.size} radius={0.01}>
            <meshStandardMaterial color="#2a2128" metalness={0.9} roughness={0.3} />
          </RoundedBox>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              position={h.finsAlong === 'y' ? [0, -h.size[1] / 2 + 0.04 + i * 0.063, h.size[2] / 2 + 0.006] : [-h.size[0] / 2 + 0.04 + i * 0.063, 0, h.size[2] / 2 + 0.006]}
            >
              <boxGeometry args={h.finsAlong === 'y' ? [h.size[0] * 0.9, 0.012, 0.012] : [0.012, h.size[1] * 0.9, 0.012]} />
              <meshStandardMaterial color="#52454d" metalness={1} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={h.finsAlong === 'y' ? [h.size[0] / 2 - 0.01, 0, h.size[2] / 2 + 0.01] : [0, -h.size[1] / 2 + 0.01, h.size[2] / 2 + 0.01]}>
            <boxGeometry args={h.finsAlong === 'y' ? [0.008, h.size[1] * 0.85, 0.008] : [h.size[0] * 0.85, 0.008, 0.008]} />
            <Glow intensity={2.5} />
          </mesh>
        </group>
      ))}
      {/* chipset */}
      <group position={[0.38, -0.75, 0.04]}>
        <RoundedBox args={[0.3, 0.22, 0.04]} radius={0.01}>
          <meshStandardMaterial color="#2a2128" metalness={0.9} roughness={0.3} />
        </RoundedBox>
        <Text font={MONO_BOLD} fontSize={0.035} position={[0, 0, 0.022]} color={SIGNAL} anchorX="center" anchorY="middle">
          FZR
        </Text>
      </group>
      {/* capacitores */}
      {caps.map(([x, y], i) => (
        <group key={i} position={[x, y, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
            <meshStandardMaterial color="#3b3036" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.031, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.002, 16]} />
            <meshStandardMaterial color="#9a9196" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* espelho de I/O e conector de 24 pinos */}
      <mesh position={[-0.62, 0.55, 0.07]}>
        <boxGeometry args={[0.16, 0.5, 0.12]} />
        <meshStandardMaterial color="#8d8489" metalness={1} roughness={0.35} />
      </mesh>
      <mesh position={[0.74, 0.0, 0.05]}>
        <boxGeometry args={[0.05, 0.3, 0.06]} />
        <meshStandardMaterial color="#141016" roughness={0.6} />
      </mesh>
    </group>
  )
}

// o processador em detalhe: base verde com contatos e capacitores, tampa metálica escovada e chanfrada,
// gravação em texto vetorial (nítida em qualquer zoom: é o que vai virar tela)
function Cpu({ brushed, stats, en }: { brushed: THREE.Texture; stats: SceneStats; en: boolean }) {
  const pads = useMemo(() => {
    const list: [number, number][] = []
    for (let i = 0; i < 18; i++) {
      const t = -0.2 + (i / 17) * 0.4
      list.push([t, 0.213], [t, -0.213], [0.213, t], [-0.213, t])
    }
    return list
  }, [])
  return (
    <group>
      <RoundedBox args={[0.46, 0.46, 0.03]} radius={0.006}>
        <meshStandardMaterial color="#1e5641" roughness={0.45} metalness={0.2} />
      </RoundedBox>
      {pads.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.016]}>
          <boxGeometry args={[0.008, 0.008, 0.002]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
        </mesh>
      ))}
      {[-0.18, 0.18].flatMap((x) =>
        [-0.18, 0.18].map((y) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.02]}>
            <boxGeometry args={[0.03, 0.012, 0.008]} />
            <meshStandardMaterial color="#6b4b3a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))
      )}
      <RoundedBox args={[0.37, 0.37, 0.035]} radius={0.012} smoothness={6} position={[0, 0, 0.033]}>
        <meshPhysicalMaterial map={brushed} metalness={0.9} roughness={0.32} clearcoat={0.25} clearcoatRoughness={0.4} />
      </RoundedBox>
      <group position={[0, 0, 0.0515]}>
        <Text font={MONO_BOLD} fontSize={0.016} position={[-0.034, 0.142, 0]} color="#2b2024" anchorX="center" anchorY="middle" sdfGlyphSize={128}>
          zanoni
        </Text>
        <Text font={MONO_BOLD} fontSize={0.016} position={[0.052, 0.142, 0]} color={SIGNAL} anchorX="center" anchorY="middle" sdfGlyphSize={128}>
          .dev.br
        </Text>
        <Text font={DISPLAY} fontSize={0.15} position={[0, 0.018, 0]} color="#2b2024" anchorX="center" anchorY="middle" letterSpacing={-0.04} sdfGlyphSize={128}>
          {String(stats.projects)}
        </Text>
        <Text font={MONO_BOLD} fontSize={0.024} position={[0, -0.075, 0]} color={SIGNAL} anchorX="center" anchorY="middle" letterSpacing={0.2} sdfGlyphSize={128}>
          {en ? 'PROJECTS' : 'PROJETOS'}
        </Text>
        <Text font={MONO} fontSize={0.011} position={[0, -0.112, 0]} color="#5b4a52" anchorX="center" anchorY="middle" sdfGlyphSize={128}>
          {`${stats.technologies} TECH · ${stats.companies} ${en ? 'COMPANIES' : 'EMPRESAS'}`}
        </Text>
        <Text font={MONO} fontSize={0.009} position={[0, -0.143, 0]} color="#5b4a52" anchorX="center" anchorY="middle" sdfGlyphSize={128}>
          FZR-01 · BRASIL
        </Text>
        <mesh position={[-0.155, -0.155, 0]}>
          <circleGeometry args={[0.008, 3]} />
          <meshStandardMaterial color="#2b2024" />
        </mesh>
      </group>
    </group>
  )
}

// pente DDR5 em pé na placa-mãe: comprimento no y, altura no z (os contatos entram no slot pelo -z) e
// espessura no x. Dissipador de alumínio escovado dos dois lados, barra de luz difusa em cima
function Ram({ accent, brushed }: { accent: string; brushed: THREE.Texture }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.006, 0.6, 0.1]} />
        <meshStandardMaterial color="#16241d" roughness={0.6} />
      </mesh>
      {/* contatos dourados na borda de baixo, com o chanfro de encaixe fora do centro */}
      {Array.from({ length: 34 }, (_, i) => -0.28 + i * 0.017)
        .filter((y) => Math.abs(y + 0.06) > 0.012)
        .map((y) => (
          <mesh key={y} position={[0, y, -0.048]}>
            <boxGeometry args={[0.008, 0.011, 0.012]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
          </mesh>
        ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.007, 0, 0.006]}>
          <RoundedBox args={[0.006, 0.6, 0.086]} radius={0.002}>
            <meshStandardMaterial map={brushed} color="#9a9095" metalness={1} roughness={0.32} />
          </RoundedBox>
          {/* recortes em degrau no alto do dissipador */}
          {[-0.21, -0.07, 0.07, 0.21].map((y) => (
            <mesh key={y} position={[side * 0.0035, y, 0.03]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[0.002, 0.1, 0.006]} />
              <meshStandardMaterial color="#1b1519" metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
          {/* faixa de cor e a marca, viradas para fora e correndo ao longo do pente (y), dentro da altura dele */}
          <group position={[side * 0.0032, 0, 0.012]} rotation={[0, side * (Math.PI / 2), 0]}>
            <mesh>
              <planeGeometry args={[0.01, 0.5]} />
              <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
            </mesh>
          </group>
          <group position={[side * 0.0032, 0, -0.018]} rotation={[0, side * (Math.PI / 2), 0]}>
            <Text font={MONO_BOLD} fontSize={0.016} rotation={[0, 0, Math.PI / 2]} color="#f6eae3" anchorX="center" anchorY="middle" letterSpacing={0.12}>
              FZR · DDR5-6000
            </Text>
          </group>
        </group>
      ))}
      {/* barra de luz: base escura e difusor aceso */}
      <mesh position={[0, 0, 0.054]}>
        <boxGeometry args={[0.022, 0.6, 0.008]} />
        <meshStandardMaterial color="#1b1519" metalness={0.7} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.016, 0.57, 0.014]} radius={0.004} position={[0, 0, 0.064]}>
        <Glow color={accent} intensity={2.2} />
      </RoundedBox>
    </group>
  )
}

function Gpu({ brushed }: { brushed: THREE.Texture }) {
  return (
    <group>
      <RoundedBox args={[1.25, 0.12, 0.5]} radius={0.03}>
        <meshStandardMaterial color="#231b21" metalness={0.75} roughness={0.3} />
      </RoundedBox>
      {/* backplate escovado em cima, com a marca */}
      <RoundedBox args={[1.2, 0.012, 0.46]} radius={0.004} position={[0, 0.066, 0]}>
        <meshStandardMaterial map={brushed} color="#6b6166" metalness={1} roughness={0.3} />
      </RoundedBox>
      <Text font={MONO_BOLD} fontSize={0.05} position={[-0.25, 0.074, 0]} rotation={[-Math.PI / 2, 0, 0]} color={SIGNAL} anchorX="center" anchorY="middle">
        FZR · AI
      </Text>
      {/* aletas do dissipador entre a carcaça e as ventoinhas */}
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={i} position={[-0.58 + i * 0.046, -0.085, 0]}>
          <boxGeometry args={[0.006, 0.05, 0.46]} />
          <meshStandardMaterial color="#8d8489" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      {[-0.32, 0.32].map((x) => (
        <group key={x} position={[x, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Fan size={0.4} />
        </group>
      ))}
      <mesh position={[0, 0.0, 0.252]}>
        <boxGeometry args={[1.1, 0.012, 0.006]} />
        <Glow intensity={3} />
      </mesh>
      {/* espelho PCIe e contatos dourados */}
      <mesh position={[-0.64, -0.02, 0]}>
        <boxGeometry args={[0.02, 0.26, 0.5]} />
        <meshStandardMaterial color="#9a9196" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[-0.05, -0.08, -0.2]}>
        <boxGeometry args={[0.6, 0.03, 0.012]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
      </mesh>
    </group>
  )
}

// SSD M.2 deitado na placa-mãe: comprimento no x, espessura no z (de frente para o vidro), dissipador
// escovado com a etiqueta e os contatos dourados na ponta que entra no slot
function Nvme({ brushed }: { brushed: THREE.Texture }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.32, 0.085, 0.006]} />
        <meshStandardMaterial color="#16241d" roughness={0.6} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-0.17, -0.034 + i * 0.0085, 0]}>
          <boxGeometry args={[0.02, 0.005, 0.007]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <RoundedBox args={[0.27, 0.08, 0.016]} radius={0.004} position={[0.015, 0, 0.011]}>
        <meshStandardMaterial map={brushed} color="#6b6166" metalness={1} roughness={0.3} />
      </RoundedBox>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.1 + i * 0.012, 0, 0.0195]}>
          <boxGeometry args={[0.004, 0.07, 0.003]} />
          <meshStandardMaterial color="#2f2530" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <Text font={MONO_BOLD} fontSize={0.016} position={[-0.1, 0.012, 0.0195]} color="#2b2024" anchorX="left" anchorY="middle" letterSpacing={0.08}>
        FZR NVMe · 2TB
      </Text>
      <Text font={MONO} fontSize={0.011} position={[-0.1, -0.014, 0.0195]} color="#3d3036" anchorX="left" anchorY="middle" letterSpacing={0.1}>
        DATABASE · PCIe 5.0
      </Text>
      <mesh position={[0.015, -0.041, 0.011]}>
        <boxGeometry args={[0.25, 0.003, 0.012]} />
        <Glow intensity={2} />
      </mesh>
    </group>
  )
}

// HD de 3,5" deitado no fundo do gabinete: tampa escovada com o eixo dos pratos e parafusos, etiqueta
// creme com o uso (backup), placa controladora embaixo e os conectores SATA atrás
function Hdd({ brushed, label }: { brushed: THREE.Texture; label: string }) {
  const steel = { color: '#8d8489', metalness: 1, roughness: 0.3 } as const
  return (
    <group>
      <RoundedBox args={[0.4, 0.07, 0.58]} radius={0.01}>
        <meshStandardMaterial color="#2a2126" metalness={0.7} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.38, 0.006, 0.56]} radius={0.003} position={[0, 0.036, 0]}>
        <meshStandardMaterial map={brushed} color="#7a7075" metalness={1} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.041, 0.12]}>
        <cylinderGeometry args={[0.13, 0.13, 0.004, 48]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, 0.045, 0.12]}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 24]} />
        <meshStandardMaterial color="#5b4a52" metalness={1} roughness={0.25} />
      </mesh>
      {[-0.17, 0.17].flatMap((x) =>
        [-0.26, 0.26].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.041, z]}>
            <cylinderGeometry args={[0.009, 0.009, 0.004, 12]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        ))
      )}
      <group position={[0, 0.0405, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial color="#f6eae3" roughness={0.7} />
        </mesh>
        <Text font={DISPLAY} fontSize={0.045} position={[-0.14, 0.05, 0.001]} color="#2b2024" anchorX="left" anchorY="middle" letterSpacing={-0.02}>
          {label}
        </Text>
        <Text font={MONO_BOLD} fontSize={0.017} position={[-0.14, -0.005, 0.001]} color={SIGNAL} anchorX="left" anchorY="middle" letterSpacing={0.1}>
          FZR · 8TB · 7200RPM
        </Text>
        <Text font={MONO} fontSize={0.012} position={[-0.14, -0.04, 0.001]} color="#5b4a52" anchorX="left" anchorY="middle" letterSpacing={0.08}>
          SNAPSHOTS · RESTORE · 3-2-1
        </Text>
        <mesh position={[0, -0.075, 0.001]}>
          <planeGeometry args={[0.28, 0.006]} />
          <Glow intensity={1.6} />
        </mesh>
      </group>
      <mesh position={[0, -0.037, 0.02]}>
        <boxGeometry args={[0.3, 0.004, 0.4]} />
        <meshStandardMaterial color="#16241d" roughness={0.6} />
      </mesh>
      {[-0.08, 0.06].map((x, i) => (
        <mesh key={x} position={[x, -0.005, -0.292]}>
          <boxGeometry args={[i ? 0.06 : 0.1, 0.02, 0.006]} />
          <meshStandardMaterial color="#0f0b0d" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// saída de ar da fonte: posição no eixo da largura da traseira (u = z do mundo) e raio. A fonte e a chapa
// de trás do gabinete usam o mesmo valor, então a furação da chapa fica alinhada com a ventoinha da fonte
const PSU_EXHAUST = { u: 0.12, r: 0.13 }

// grade em colmeia recortada num círculo (furinhos hexagonais escuros)
function Honeycomb({ radius, cell, z }: { radius: number; cell: number; z: number }) {
  const holes = useMemo(() => {
    const out: [number, number][] = []
    const step = cell * 2.1
    const n = Math.ceil(radius / step) + 1
    for (let row = -n; row <= n; row++)
      for (let col = -n; col <= n; col++) {
        const x = col * step + (row % 2 ? step / 2 : 0)
        const y = row * step * 0.87
        if (Math.hypot(x, y) < radius - cell) out.push([x, y])
      }
    return out
  }, [radius, cell])
  return (
    <group position={[0, 0, z]}>
      {holes.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[cell, cell, 0.003, 6]} />
          <meshStandardMaterial color="#3a2f37" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// fonte modular: carcaça preta, ventoinha de 135 mm com grade em cima, placa escovada com a marca na
// lateral, colmeia de ventilação + tomada e chave atrás, painel de conectores modulares na frente
function Psu({ brushed }: { brushed: THREE.Texture }) {
  const blades = useRef<THREE.Group>(null)
  const exhaust = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.y -= dt * 5
    if (exhaust.current) exhaust.current.rotation.z -= dt * 8
  })
  const grille = { color: '#6b6166', metalness: 1, roughness: 0.3 } as const
  return (
    <group>
      <RoundedBox args={[1.0, 0.32, 0.75]} radius={0.035} smoothness={4}>
        <meshStandardMaterial color="#1b1519" metalness={0.5} roughness={0.55} />
      </RoundedBox>
      {/* ventoinha: fundo escuro, pás girando e grade de anéis por cima */}
      <group position={[-0.08, 0.161, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 64]} />
          <meshStandardMaterial color="#0f0b0d" roughness={0.8} />
        </mesh>
        <group ref={blades} position={[0, 0.006, 0]}>
          {Array.from({ length: 7 }, (_, i) => (
            <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
              <mesh position={[0.16, 0, 0]} rotation={[0.45, 0, 0.12]}>
                <boxGeometry args={[0.24, 0.004, 0.1]} />
                <meshStandardMaterial color="#2a2126" metalness={0.2} roughness={0.5} />
              </mesh>
            </group>
          ))}
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.012, 32]} />
            <meshStandardMaterial color="#1a1418" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.045, 32]} />
            <Glow intensity={1.8} />
          </mesh>
        </group>
        {[0.1, 0.17, 0.24, 0.3].map((r) => (
          <mesh key={r} position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.005, 8, 96]} />
            <meshStandardMaterial {...grille} />
          </mesh>
        ))}
        {[0, Math.PI / 2].map((rot) => (
          <mesh key={rot} position={[0, 0.016, 0]} rotation={[0, rot, 0]}>
            <boxGeometry args={[0.6, 0.008, 0.008]} />
            <meshStandardMaterial {...grille} />
          </mesh>
        ))}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.305, 0.315, 96]} />
          <Glow intensity={2.2} />
        </mesh>
      </group>
      {/* lateral virada para a câmera: placa escovada com a marca (é a base de tudo) */}
      <group position={[0, 0, 0.378]}>
        <RoundedBox args={[0.88, 0.24, 0.008]} radius={0.003}>
          <meshStandardMaterial map={brushed} color="#6b6166" metalness={1} roughness={0.3} />
        </RoundedBox>
        <Text font={DISPLAY} fontSize={0.085} position={[-0.38, 0.035, 0.005]} color="#2b2024" anchorX="left" anchorY="middle" letterSpacing={-0.03}>
          FZR
        </Text>
        <Text font={MONO_BOLD} fontSize={0.026} position={[-0.38, -0.045, 0.005]} color="#2b2024" anchorX="left" anchorY="middle" letterSpacing={0.14}>
          ARCHITECTURE FIRST
        </Text>
        <Text font={MONO_BOLD} fontSize={0.05} position={[0.38, 0.03, 0.005]} color={SIGNAL} anchorX="right" anchorY="middle">
          850W
        </Text>
        <Text font={MONO} fontSize={0.019} position={[0.38, -0.03, 0.005]} color="#3d3036" anchorX="right" anchorY="middle" letterSpacing={0.1}>
          80+ PLATINUM · MODULAR
        </Text>
        <mesh position={[0, -0.095, 0.005]}>
          <boxGeometry args={[0.8, 0.006, 0.002]} />
          <Glow intensity={2.4} />
        </mesh>
      </group>
      {/* traseira (encostada na chapa de trás do gabinete): ventoinha de exaustão que joga o ar para fora,
          atrás de uma grade em colmeia, mais a tomada e a chave. Mesmo desenho da saída na chapa (PSU_EXHAUST) */}
      <group position={[-0.502, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <group position={[PSU_EXHAUST.u, 0, 0]}>
          <mesh>
            <circleGeometry args={[PSU_EXHAUST.r, 48]} />
            <meshStandardMaterial color="#0a0708" roughness={0.9} />
          </mesh>
          <group ref={exhaust} position={[0, 0, 0.003]}>
            {Array.from({ length: 7 }, (_, i) => (
              <group key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]}>
                <mesh position={[0, PSU_EXHAUST.r * 0.5, 0]} rotation={[0, 0.5, 0.15]}>
                  <boxGeometry args={[PSU_EXHAUST.r * 0.38, PSU_EXHAUST.r * 0.7, 0.003]} />
                  <meshStandardMaterial color="#2a2126" metalness={0.2} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
            <mesh>
              <circleGeometry args={[PSU_EXHAUST.r * 0.28, 24]} />
              <meshStandardMaterial color="#1a1418" metalness={0.6} roughness={0.35} />
            </mesh>
          </group>
          <Honeycomb radius={PSU_EXHAUST.r} cell={0.022} z={0.008} />
          <mesh position={[0, 0, 0.008]}>
            <ringGeometry args={[PSU_EXHAUST.r, PSU_EXHAUST.r + 0.012, 48]} />
            <Glow intensity={1.6} />
          </mesh>
        </group>
        <mesh position={[-0.25, 0.04, 0.004]}>
          <boxGeometry args={[0.09, 0.06, 0.008]} />
          <meshStandardMaterial color="#0f0b0d" roughness={0.7} />
        </mesh>
        <mesh position={[-0.25, -0.06, 0.006]}>
          <boxGeometry args={[0.04, 0.05, 0.012]} />
          <Glow intensity={1.6} />
        </mesh>
      </group>
      {/* frente: conectores modulares em fileiras e a luz de status */}
      <group position={[0.502, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.66, 0.24, 0.004]} />
          <meshStandardMaterial color="#120e10" roughness={0.7} />
        </mesh>
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => (
            <mesh key={`${row}-${col}`} position={[-0.25 + col * 0.1, 0.07 - row * 0.07, 0.006]}>
              <boxGeometry args={[0.075, 0.045, 0.01]} />
              <meshStandardMaterial color={row === 0 ? '#2f2530' : '#241c21'} metalness={0.3} roughness={0.6} />
            </mesh>
          ))
        )}
        <mesh position={[0, -0.11, 0.006]}>
          <boxGeometry args={[0.6, 0.006, 0.004]} />
          <Glow color={CARAMEL} intensity={1.6} />
        </mesh>
      </group>
    </group>
  )
}

// traseira do gabinete (o lado x = -1): espelho de I/O da placa-mãe, saída da ventoinha com grade em
// colmeia, tampas dos slots PCIe e a abertura da fonte. Grupo virado para fora: u = z do mundo, v = y.
// A furação atravessa a chapa: por dentro (visível com o PC aberto) é o mesmo desenho espelhado no x,
// alinhado com o de fora (o three inverte a face dos triângulos sozinho com a escala negativa)
function RearPanel({ inner = false }: { inner?: boolean }) {
  const dark = { color: '#0f0b0d', roughness: 0.8 } as const
  const steel = { color: '#8d8489', metalness: 1, roughness: 0.3 } as const
  return (
    <group position={[inner ? 0.027 : -0.027, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[1, 1, inner ? -1 : 1]}>
      {/* espelho de I/O com as portas */}
      <mesh position={[-0.3, 0.62, 0]}>
        <boxGeometry args={[0.2, 0.44, 0.006]} />
        <meshStandardMaterial color="#4a4046" metalness={0.9} roughness={0.35} />
      </mesh>
      {[0.8, 0.74, 0.68, 0.6, 0.54].map((y, i) => (
        <mesh key={y} position={[-0.33, y, 0.005]}>
          <boxGeometry args={[0.07, 0.035, 0.006]} />
          <meshStandardMaterial color={i < 2 ? '#2b4a8c' : '#0f0b0d'} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[-0.26, 0.78, 0.005]}>
        <boxGeometry args={[0.05, 0.05, 0.006]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {[0.66, 0.6, 0.54, 0.48].map((y, i) => (
        <mesh key={y} position={[-0.26, y, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
          <meshStandardMaterial color={i === 0 ? SIGNAL : i === 1 ? CARAMEL : '#5b4a52'} roughness={0.5} />
        </mesh>
      ))}
      {/* ventoinha de saída: aro com parafusos e grade em colmeia */}
      <group position={[0.17, 0.6, 0]}>
        <mesh>
          <ringGeometry args={[0.2, 0.22, 64]} />
          <meshStandardMaterial {...steel} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 7 }, (_, col) => {
            const x = -0.15 + col * 0.05 + (row % 2) * 0.025
            const y = -0.15 + row * 0.05
            if (Math.hypot(x, y) > 0.18) return null
            return (
              <mesh key={`${row}-${col}`} position={[x, y, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.021, 0.021, 0.004, 6]} />
                <meshStandardMaterial {...dark} />
              </mesh>
            )
          })
        )}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sy) => (
            <mesh key={`${sx}${sy}`} position={[sx * 0.2, sy * 0.2, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.008, 12]} />
              <meshStandardMaterial {...steel} />
            </mesh>
          ))
        )}
      </group>
      {/* tampas dos slots PCIe com furinhos de ventilação */}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[-0.12, 0.2 - i * 0.075, 0.003]}>
          <mesh>
            <boxGeometry args={[0.42, 0.055, 0.004]} />
            <meshStandardMaterial color={i < 2 ? '#4a4046' : '#2f2530'} metalness={0.9} roughness={0.35} />
          </mesh>
          {Array.from({ length: 6 }, (_, j) => (
            <mesh key={j} position={[-0.12 + j * 0.05, 0, 0.003]}>
              <boxGeometry args={[0.03, 0.012, 0.002]} />
              <meshStandardMaterial {...dark} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0.22, -0.1, 0.003]}>
        <boxGeometry args={[0.012, 0.6, 0.004]} />
        <Glow color={CARAMEL} intensity={1.2} />
      </mesh>
      {/* abertura da fonte: moldura, saída de ar em colmeia alinhada com a ventoinha da fonte e o recorte
          da tomada */}
      <group position={[0, -0.86, 0.003]}>
        {[
          [0, 0.15, 0.76, 0.02],
          [0, -0.15, 0.76, 0.02],
          [-0.37, 0, 0.02, 0.32],
          [0.37, 0, 0.02, 0.32],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.004]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        ))}
        <mesh position={[PSU_EXHAUST.u, 0, 0]}>
          <circleGeometry args={[PSU_EXHAUST.r + 0.01, 48]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <group position={[PSU_EXHAUST.u, 0, 0]}>
          <Honeycomb radius={PSU_EXHAUST.r} cell={0.02} z={0.003} />
        </group>
        <mesh position={[-0.25, 0.01, 0]}>
          <boxGeometry args={[0.13, 0.18, 0.004]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        {[-0.33, 0.33].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.006, 12]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// lateral atrás da placa-mãe: borda estampada e fendas de ventilação nas duas faces; por dentro (virada
// para a câmera) também os passa-cabos de borracha e dois SSDs presos
function SidePanel({ inner }: { inner: boolean }) {
  const rim = { color: '#3a2f37', metalness: 0.85, roughness: 0.35 } as const
  return (
    <group position={[0, 0, inner ? 0.032 : -0.032]} rotation={[0, inner ? 0 : Math.PI, 0]}>
      {[
        [0, 1.0, 1.9, 0.04],
        [0, -1.0, 1.9, 0.04],
        [-0.93, 0, 0.04, 2.0],
        [0.93, 0, 0.04, 2.0],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[w, h, 0.012]} />
          <meshStandardMaterial {...rim} />
        </mesh>
      ))}
      {inner && [0.55, 0.1, -0.35].map((y) => (
        <RoundedBox key={y} args={[0.07, 0.22, 0.01]} radius={0.02} position={[0.72, y, 0]}>
          <meshStandardMaterial color="#0f0b0d" roughness={0.9} />
        </RoundedBox>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.1, 0.88, 0]}>
          <boxGeometry args={[0.05, 0.12, 0.006]} />
          <meshStandardMaterial color="#120e10" roughness={0.8} />
        </mesh>
      ))}
      {/* por fora, o endereço do site, no mesmo estilo do logo */}
      {!inner && (
        <group position={[0, -0.05, 0.008]}>
          <Text font={MONO_BOLD} fontSize={0.14} position={[-0.045, 0, 0]} color="#f6eae3" anchorX="right" anchorY="middle">
            zanoni
          </Text>
          <Text font={MONO_BOLD} fontSize={0.14} position={[-0.045, 0, 0]} color={SIGNAL} anchorX="left" anchorY="middle">
            .dev.br
          </Text>
          <mesh position={[0, -0.13, 0]}>
            <boxGeometry args={[1.1, 0.008, 0.002]} />
            <Glow intensity={2.4} />
          </mesh>
        </group>
      )}
      {inner && [-0.55, -0.75].map((y) => (
        <group key={y} position={[-0.3, y, 0.008]}>
          <RoundedBox args={[0.5, 0.14, 0.012]} radius={0.004}>
            <meshStandardMaterial color="#1b1519" metalness={0.6} roughness={0.45} />
          </RoundedBox>
          <Text font={MONO_BOLD} fontSize={0.03} position={[-0.21, 0, 0.007]} color="#f6eae3" anchorX="left" anchorY="middle" letterSpacing={0.1}>
            NVMe · 2TB
          </Text>
          <mesh position={[0.2, 0, 0.007]}>
            <boxGeometry args={[0.04, 0.012, 0.002]} />
            <Glow intensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// painel frontal no alto do gabinete: botão de ligar com anel aceso, USB-A, USB-C e P2
function TopIo() {
  return (
    <group position={[0.8, 0.032, 0]}>
      <mesh position={[0, 0.006, 0.32]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
        <meshStandardMaterial color="#1b1519" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.013, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.038, 48]} />
        <Glow intensity={3} />
      </mesh>
      {[0.16, 0.06].map((z) => (
        <mesh key={z} position={[0, 0.003, z]}>
          <boxGeometry args={[0.03, 0.006, 0.07]} />
          <meshStandardMaterial color="#2b4a8c" roughness={0.6} />
        </mesh>
      ))}
      <RoundedBox args={[0.02, 0.006, 0.045]} radius={0.002} position={[0, 0.003, -0.03]}>
        <meshStandardMaterial color="#0f0b0d" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.003, -0.1]}>
        <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
        <meshStandardMaterial color="#0f0b0d" roughness={0.6} />
      </mesh>
    </group>
  )
}

// placas do gabinete: onde ficam montadas e para onde vão na vista explodida
// `turn`: giro no y ao abrir; a traseira vira a face de dentro para a câmera (senão fica de perfil e a furação some)
const SHELL: { key: string; at: Vec3; size: Vec3; out: Vec3; turn?: number }[] = [
  { key: 'back', at: [0, 0, -0.5], size: [2.0, 2.15, 0.06], out: [0, 0, -1.6] },
  { key: 'top', at: [0, 1.05, 0], size: [2.0, 0.06, 1.06], out: [0, 1.5, 0] },
  { key: 'bottom', at: [0, -1.05, 0], size: [2.0, 0.06, 1.06], out: [0, -0.35, 0] },
  { key: 'left', at: [-1.0, 0, 0], size: [0.05, 2.15, 1.06], out: [-1.3, 0, -0.5], turn: -0.85 },
  { key: 'front', at: [1.0, 0, 0], size: [0.05, 2.15, 1.06], out: [2.3, 0, 0] },
]

type Part = {
  key: string
  assembled: Vec3
  offset: Vec3
  // giro (em radianos) que a peça dá enquanto se afasta, e o atraso dela na sequência (0..0.4)
  spin: Vec3
  delay: number
  labelAt?: Vec3
  node: React.ReactNode
}

function Pc({
  progressRef,
  serversRef,
  stats,
  en,
}: {
  progressRef: React.RefObject<number>
  serversRef: React.RefObject<number>
  stats: SceneStats
  en: boolean
}) {
  const brushed = useMemo(() => brushedTexture(), [])
  const pcb = useMemo(() => pcbTexture(), [])
  const tmp = useMemo(
    () => ({ cpu: new THREE.Vector3(), normal: new THREE.Vector3(), orbit: new THREE.Vector3(), look: new THREE.Vector3(), close: new THREE.Vector3() }),
    []
  )
  const cpuLight = useRef<THREE.PointLight>(null)
  // parado na seção, o PC gira sozinho no sentido anti-horário (visto de cima) para mostrar as peças;
  // voltou a rolar (ou começou o mergulho), ele volta para a volta inteira mais próxima
  const idle = useRef({ last: -1, still: 0, speed: 0, spin: 0 })
  const root = useRef<THREE.Group>(null)
  const glass = useRef<THREE.Mesh>(null)
  const partRefs = useRef<Record<string, THREE.Group | null>>({})
  const shellRefs = useRef<Record<string, THREE.Group | null>>({})
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { projects, technologies, companies } = stats

  const parts: Part[] = useMemo(
    () => [
      { key: 'board', assembled: [0, 0.05, -0.42], offset: [0, 0.1, -1.1], spin: [0, 0, 0], delay: 0, labelAt: [-0.4, -0.2, 0.15], node: <Board pcb={pcb} /> },
      {
        key: 'cpu',
        assembled: [0.12, 0.42, -0.375],
        offset: [0.2, 0.75, 1.5],
        spin: [0, 0, 0],
        delay: 0.2,
        labelAt: [0, 0.36, 0.1],
        node: <Cpu brushed={brushed} stats={{ projects, technologies, companies }} en={en} />,
      },
      ...[0, 1, 2, 3].map<Part>((i) => ({
        key: `ram${i}`,
        assembled: [0.5 + i * 0.075, 0.42, -0.33],
        offset: [0.35 + i * 0.28, 1.15, 0.9],
        // vira a face larga (o dissipador com a marca) para a câmera; de perfil só apareciam quatro riscos
        spin: [0, -1.15, (i - 1.5) * 0.12],
        delay: 0.26 + i * 0.03,
        labelAt: [0, 0.42, 0.1],
        node: <Ram accent={i % 2 ? CARAMEL : SIGNAL} brushed={brushed} />,
      })),
      { key: 'gpu', assembled: [-0.05, -0.2, -0.12], offset: [0.15, -0.35, 1.45], spin: [-0.5, 0.15, 0], delay: 0.12, labelAt: [0, 0.42, 0], node: <Gpu brushed={brushed} /> },
      // a fonte sai para a frente e para a esquerda, sem descer (antes afundava na plataforma)
      { key: 'psu', assembled: [-0.47, -0.86, 0], offset: [-0.3, 0.02, 2.2], spin: [0, 0.35, 0], delay: 0.06, labelAt: [0, 0.5, 0], node: <Psu brushed={brushed} /> },
      // SSD na placa-mãe, entre o processador e a placa de vídeo; HDs no fundo, na frente da fonte
      { key: 'nvme', assembled: [-0.22, 0.12, -0.405], offset: [1.27, -0.07, 2.0], spin: [-0.15, 0.4, 0.1], delay: 0.18, labelAt: [0, 0.26, 0.05], node: <group scale={1.6}><Nvme brushed={brushed} /></group> },
      ...[0, 1].map<Part>((i) => ({
        key: `hdd${i}`,
        assembled: [0.5, -0.92 + i * 0.09, 0.05],
        offset: [1.0 - i * 0.15, 0.05 + i * 0.6, 1.9 + i * 0.4],
        spin: [0, -0.4 - i * 0.2, 0],
        delay: 0.1 + i * 0.04,
        labelAt: [0, -0.22, 0.25],
        node: <Hdd brushed={brushed} label={i ? 'RESTORE' : 'BACKUP'} />,
      })),
      ...[0.55, 0, -0.55].map<Part>((y, i) => ({
        key: `fan${i}`,
        assembled: [0.92, y + 0.15, 0],
        offset: [1.6, (1 - i) * 0.45, 0.5],
        spin: [0, -0.5, 0],
        delay: 0.08 + i * 0.04,
        // entre a ventoinha do meio e a de baixo, sem cobrir nenhuma
        labelAt: [0, -0.5, 0.4],
        node: (
          <group rotation={[0, Math.PI / 2, 0]}>
            <Fan />
          </group>
        ),
      })),
    ],
    [pcb, brushed, projects, technologies, companies, en]
  )

  useFrame((state, dt) => {
    const p = progressRef.current ?? 0
    const raw = segment(p, STORY.explodeStart, STORY.explodeEnd)
    const e = easeInOut(raw)
    const d = easeInOut(segment(p, STORY.diveStart, STORY.diveEnd))
    const it = idle.current
    if (Math.abs(p - it.last) > 1e-4) it.still = 0
    else it.still += dt
    it.last = p
    // só gira com o PC fechado: aberto (desmontando, etiquetas ou mergulho) fica parado de frente
    const spinning = it.still > 1.2 && raw === 0
    // bem devagar de frente; acelera aos poucos enquanto passa pelas costas (ninguém quer ver a traseira)
    // e desacelera ao voltar para a frente: (1 - cos)/2 vai de 0 (frente) a 1 (costas) sem degrau
    const back = Math.pow((1 - Math.cos(it.spin)) / 2, 2)
    it.speed += ((spinning ? 0.1 * (1 + 5 * back) : 0) - it.speed) * (1 - Math.exp(-dt * 1.5))
    if (spinning) it.spin += it.speed * dt
    else {
      // rolou: para de girar na hora e vira suavemente para a frente (a volta inteira mais próxima)
      it.speed = 0
      it.spin += (Math.round(it.spin / (Math.PI * 2)) * Math.PI * 2 - it.spin) * (1 - Math.exp(-dt * 2.5))
    }
    if (root.current) {
      // gira para mostrar o lado de vidro e continua balançando devagar; no mergulho para de balançar
      root.current.rotation.y = -0.55 + e * 0.75 + it.spin + Math.sin(state.clock.elapsedTime * 0.25) * 0.06 * (1 - d)
      root.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03 * (1 - d)
    }
    for (const part of parts) {
      const g = partRefs.current[part.key]
      if (!g) continue
      // cada peça sai na sua vez (atraso) e gira um pouco no ar
      const k = easeInOut(clamp01((raw - part.delay) / (1 - 0.4)))
      g.position.set(
        part.assembled[0] + part.offset[0] * k,
        part.assembled[1] + part.offset[1] * k,
        part.assembled[2] + part.offset[2] * k
      )
      g.rotation.set(part.spin[0] * k, part.spin[1] * k, part.spin[2] * k)
    }
    for (const panel of SHELL) {
      const g = shellRefs.current[panel.key]
      if (!g) continue
      g.position.set(panel.at[0] + panel.out[0] * e, panel.at[1] + panel.out[1] * e, panel.at[2] + panel.out[2] * e)
      g.rotation.y = (panel.turn ?? 0) * e
    }
    if (glass.current) {
      glass.current.position.z = 0.51 + e * 2.2
      glass.current.position.x = e * 0.9
      ;(glass.current.material as THREE.MeshPhysicalMaterial).opacity = 0.22 * (1 - e)
    }
    const labelAlpha = clamp01((e - 0.8) / 0.2) * (1 - clamp01(d * 4))
    for (const key in labelRefs.current) {
      const el = labelRefs.current[key]
      if (el) el.style.opacity = String(labelAlpha)
    }
    // órbita (montado → desmontado) e, no mergulho, voo até a tampa do processador, de frente para ela
    tmp.orbit.set(3.1 - e * 0.3, 1.0 + e * 0.6, 5.3 + e * 3.2)
    tmp.look.set(0, -0.05 + e * 0.3, 0)
    const cpu = partRefs.current.cpu
    if (cpu && root.current && d > 0) {
      cpu.getWorldPosition(tmp.cpu)
      tmp.normal.set(0, 0, 1).applyQuaternion(root.current.quaternion)
      // começa a uns 1,4 de distância e termina perto da tampa (ela enche a tela)
      tmp.close.copy(tmp.cpu).addScaledVector(tmp.normal, 1.4 - 0.95 * clamp01((d - 0.5) / 0.5))
      tmp.orbit.lerp(tmp.close, clamp01(d * 1.6))
      tmp.look.lerp(tmp.cpu, clamp01(d * 1.6))
    }
    // depois do corte o PC some e a câmera vai para os servidores (no escuro, ninguém vê a troca). Em tela
    // estreita os servidores ficam no centro; larga, à direita do texto do capítulo
    const cut = p >= STORY.cut
    if (root.current) root.current.visible = !cut
    serversRef.current = segment(p, STORY.serversStart, STORY.serversEnd)
    // com os servidores, tudo abaixo do chão é cortado: eles sobem "de dentro" da plataforma
    state.gl.clippingPlanes = cut ? FLOOR_CLIP : NO_CLIP
    if (cut) {
      const narrow = state.size.width < 640
      if (narrow) {
        // tela em pé: afasta até os quatro caberem na largura (fov 38°) e desce a cena para baixo do texto
        const dist = Math.max(9.5, 2.2 / (Math.tan((19 * Math.PI) / 180) * (state.size.width / state.size.height)))
        tmp.orbit.set(0, 1.7, dist)
        tmp.look.set(0, 0.9, 0)
      } else {
        tmp.orbit.set(-1.1, 1.05, 7.6)
        tmp.look.set(-1.4, 0.1, 0)
      }
    }
    const cam = state.camera
    cam.position.lerp(tmp.orbit, 1 - Math.exp(-dt * (cut ? 3 : 5)))
    cam.lookAt(tmp.look)
    if (cpuLight.current) cpuLight.current.intensity = 1.4 * d
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
              <Glow />
            </mesh>
          )}
          {panel.key === 'top' && (
            <>
              <mesh position={[-0.1, 0.032, 0]}>
                <boxGeometry args={[1.5, 0.004, 0.7]} />
                <meshStandardMaterial color="#1a1418" metalness={0.5} roughness={0.7} />
              </mesh>
              <TopIo />
            </>
          )}
          {panel.key === 'top' && (
            <Html position={[-1.25, 0.05, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => { labelRefs.current.case = el }}
                style={{ opacity: 0 }}
                className="whitespace-nowrap rounded-lg border border-signal bg-background/85 px-3 py-1.5 text-center shadow-lg backdrop-blur"
              >
                <div className="font-display text-sm font-medium text-foreground">{MEANING.case.concept[en ? 1 : 0]}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-signal">{MEANING.case.name[en ? 1 : 0]}</div>
              </div>
            </Html>
          )}
          {panel.key === 'left' && (
            <>
              <RearPanel />
              <RearPanel inner />
            </>
          )}
          {panel.key === 'back' && (
            <>
              <SidePanel inner />
              <SidePanel inner={false} />
            </>
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
          {part.key in MEANING && (
            <Html position={part.labelAt} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => { labelRefs.current[part.key] = el }}
                style={{ opacity: 0 }}
                className="whitespace-nowrap rounded-lg border border-signal/50 bg-background/85 px-3 py-1.5 text-center shadow-lg backdrop-blur"
              >
                <div className="font-display text-sm font-medium text-foreground">{MEANING[part.key].concept[en ? 1 : 0]}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-signal">{MEANING[part.key].name[en ? 1 : 0]}</div>
              </div>
            </Html>
          )}
        </group>
      ))}
      <pointLight position={[0.2, 0.2, 0]} intensity={4} distance={3} color={SIGNAL} />
      {/* luz que acende sobre a tampa no mergulho, para a gravação ficar legível */}
      <pointLight ref={cpuLight} position={[-0.6, 2.0, 1.6]} intensity={0} distance={3} color="#fff1e6" />
    </group>
  )
}

function Platform() {
  return (
    <group position={[0, -1.12, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 96]} />
        <meshStandardMaterial color="#241b20" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.32, 2.4, 128]} />
        <meshBasicMaterial color={SIGNAL} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.5, 1.52, 128]} />
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
  useFrame((_, dt) => {
    const goal = source.get()
    targetRef.current += (goal - targetRef.current) * (1 - Math.exp(-dt * 7))
  })
  return null
}

// monta junto com o resto da cena: o Canvas só mostra os filhos quando tudo (fontes do texto 3D etc.)
// terminou de carregar, então o primeiro quadro aqui significa cena pronta e shaders compilados
function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    onReady()
  })
  return null
}

export default function PcScene({
  progress,
  active,
  stats,
  en,
  servers,
  onOpen,
  onReady,
}: {
  progress: MotionValue<number>
  active: boolean
  stats: SceneStats
  en: boolean
  servers: ServerProject[]
  onOpen: (project: NonNullable<ServerProject>) => void
  onReady: () => void
}) {
  const smoothed = useRef(progress.get())
  const serversProgress = useRef(0)
  return (
    <Canvas
      // longe da seção desenha só sob demanda: o primeiro quadro sai (deixa tudo pronto) e depois fica parada
      frameloop={active ? 'always' : 'demand'}
      dpr={[1, 1.5]}
      camera={{ position: [3.1, 1.0, 5.3], fov: 38 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <color attach="background" args={['#2b2024']} />
      <fog attach="fog" args={['#2b2024', 9, 26]} />
      <hemisphereLight args={['#f6eae3', '#2b2024', 0.5]} />
      <directionalLight position={[4, 6, 5]} intensity={2.0} color="#fff1e6" />
      <directionalLight position={[-5, 2, -4]} intensity={1.2} color={CARAMEL} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} color="#fff1e6" position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color={SIGNAL} position={[-4, 1, -2]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={1.2} color={CARAMEL} position={[4, 0, 2]} scale={2} />
      </Environment>
      <SmoothedProgress source={progress} targetRef={smoothed} />
      <Pc progressRef={smoothed} serversRef={serversProgress} stats={stats} en={en} />
      <Servers servers={servers} progressRef={serversProgress} onOpen={onOpen} en={en} />
      <Platform />
      <Dust />
      <Ready onReady={onReady} />
      {/* brilho real nas luzes (só o que passa de 1 brilha) e vinheta nas bordas */}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} />
        <Vignette offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  )
}
