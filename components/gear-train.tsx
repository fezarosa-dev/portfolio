'use client'

import { motion, useTransform, type MotionValue } from 'framer-motion'
import { gearPath, meshedAngle, meshedPhase, pitchRadius } from '@/lib/gears'

const MODULE = 1.45
const BIG = 8
const SMALL = 5
const THETA = 45 // direção do centro da grande pro centro da pequena (diagonal, aproveita o círculo do botão)
const BOX = 22

const rBig = pitchRadius(BIG, MODULE)
const rSmall = pitchRadius(SMALL, MODULE)
const tipBig = rBig + 0.8 * MODULE
const tipSmall = rSmall + 0.8 * MODULE
const dist = rBig + rSmall
// posição ao longo da diagonal, centrando o conjunto no ícone
const sBig = -(dist + tipSmall - tipBig) / 2
const rad = (THETA * Math.PI) / 180
const at = (s: number) => ({ x: BOX / 2 + Math.cos(rad) * s, y: BOX / 2 + Math.sin(rad) * s })

function Gear({
  teeth,
  center,
  rotation,
  className,
}: {
  teeth: number
  center: { x: number; y: number }
  rotation: MotionValue<number>
  className: string
}) {
  const size = (pitchRadius(teeth, MODULE) + 0.8 * MODULE + 1) * 2
  return (
    <motion.svg
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      width={size}
      height={size}
      style={{ rotate: rotation, left: center.x - size / 2, top: center.y - size / 2 }}
      className={`absolute ${className}`}
      aria-hidden
    >
      <path d={gearPath(teeth, MODULE)} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
    </motion.svg>
  )
}

// Ícone do botão: duas engrenagens engatadas de verdade (sentidos opostos, velocidade inversamente
// proporcional ao número de dentes). `angle` é o giro (graus) da grande; a pequena sai dele.
export function GearIcon({ angle }: { angle: MotionValue<number> }) {
  const big = useTransform(angle, (a) => THETA + a)
  const small = useTransform(angle, (a) => meshedPhase(SMALL, THETA) + meshedAngle(a, BIG, SMALL))

  return (
    <span className="relative block" style={{ width: BOX, height: BOX }} aria-hidden>
      <Gear teeth={BIG} center={at(sBig)} rotation={big} className="text-current" />
      <Gear teeth={SMALL} center={at(sBig + dist)} rotation={small} className="text-signal" />
    </span>
  )
}
