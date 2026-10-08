'use client'

import { AnimatePresence, motion, useTransform, type MotionValue } from 'framer-motion'
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
  from,
}: {
  teeth: number
  center: { x: number; y: number }
  rotation: MotionValue<number>
  className: string
  /** se informado, a engrenagem entra/sai crescendo a partir deste ponto (px, relativo ao centro final) */
  from?: { x: number; y: number }
}) {
  const size = (pitchRadius(teeth, MODULE) + 0.8 * MODULE + 1) * 2
  return (
    <motion.svg
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      width={size}
      height={size}
      style={{ rotate: rotation }}
      initial={
        from ? { scale: 0, opacity: 0, left: center.x - size / 2 + from.x, top: center.y - size / 2 + from.y } : false
      }
      animate={{ scale: 1, opacity: 1, left: center.x - size / 2, top: center.y - size / 2 }}
      exit={
        from
          ? { scale: 0, opacity: 0, left: center.x - size / 2 + from.x, top: center.y - size / 2 + from.y }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      className={`absolute ${className}`}
      aria-hidden
    >
      <path d={gearPath(teeth, MODULE)} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
    </motion.svg>
  )
}

// Ícone do botão: uma engrenagem girando; com `meshed` (hover/menu aberto) a segunda aparece engatada
// na primeira (sentidos opostos, velocidade inversamente proporcional ao número de dentes).
// `angle` é o giro (graus) da grande; a pequena sai dele.
export function GearIcon({ angle, meshed }: { angle: MotionValue<number>; meshed: boolean }) {
  const big = useTransform(angle, (a) => THETA + a)
  const small = useTransform(angle, (a) => meshedPhase(SMALL, THETA) + meshedAngle(a, BIG, SMALL))
  const bigCenter = meshed ? at(sBig) : { x: BOX / 2, y: BOX / 2 }

  return (
    <span className="relative block" style={{ width: BOX, height: BOX }} aria-hidden>
      <Gear teeth={BIG} center={bigCenter} rotation={big} className="text-current" />
      <AnimatePresence>
        {meshed && (
          <Gear
            teeth={SMALL}
            center={at(sBig + dist)}
            rotation={small}
            className="text-signal"
            from={{ x: Math.cos(rad) * 8, y: Math.sin(rad) * 8 }}
          />
        )}
      </AnimatePresence>
    </span>
  )
}
