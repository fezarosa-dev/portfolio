'use client'

import { motion, useTransform, type MotionValue } from 'framer-motion'
import { gearPath, meshedAngle, meshedPhase, pitchRadius } from '@/lib/gears'

const MODULE = 1.6
const MEDIUM = 10 // mesma engrenagem do botão: gira junto com ele
const BIG = 16
const SMALL = 6
const PAD = 0

const rBig = pitchRadius(BIG, MODULE)
const rMed = pitchRadius(MEDIUM, MODULE)
const rSmall = pitchRadius(SMALL, MODULE)
// centros em linha: grande — média — pequena, cada par a uma distância = soma dos raios primitivos
const xBig = PAD + rBig + MODULE
const xMed = xBig + rBig + rMed
const xSmall = xMed + rMed + rSmall
const width = xSmall + rSmall + MODULE + PAD
const height = (rBig + MODULE + PAD) * 2

function Gear({
  teeth,
  cx,
  rotation,
  delay,
  fromX,
  tone,
}: {
  teeth: number
  cx: number
  rotation: MotionValue<number>
  delay: number
  fromX: number
  tone: string
}) {
  const size = (pitchRadius(teeth, MODULE) + MODULE) * 2
  return (
    <motion.div
      className="absolute"
      style={{ left: cx - size / 2, top: height / 2 - size / 2, width: size, height: size }}
      initial={{ scale: 0, opacity: 0, x: fromX }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ scale: 0, opacity: 0, x: fromX, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 14, delay }}
    >
      <motion.svg
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        width={size}
        height={size}
        style={{ rotate: rotation }}
        className={tone}
        aria-hidden
      >
        <path d={gearPath(teeth, MODULE)} fill="currentColor" fillRule="evenodd" />
      </motion.svg>
    </motion.div>
  )
}

// Três engrenagens engatadas de verdade: as vizinhas giram em sentidos opostos e a velocidade é
// inversamente proporcional ao número de dentes (a pequena é a mais rápida, a grande a mais lenta).
// `angle` é o giro (graus) da engrenagem do meio, o mesmo do botão. Fica posicionada sobre o botão:
// `anchor` é o x (px) do centro do botão, onde a engrenagem do meio se encaixa.
export function GearTrain({ angle, anchor }: { angle: MotionValue<number>; anchor: number }) {
  const med = useTransform(angle, (a) => meshedPhase(MEDIUM, 0) + a)
  const big = useTransform(angle, (a) => meshedAngle(a, MEDIUM, BIG))
  const small = useTransform(angle, (a) => meshedAngle(a, MEDIUM, SMALL))

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ width, height, left: anchor - xMed, top: '50%', marginTop: -height / 2 }}
      aria-hidden
    >
      <Gear teeth={BIG} cx={xBig} rotation={big} delay={0.12} fromX={rMed + rBig} tone="text-steel" />
      <Gear teeth={MEDIUM} cx={xMed} rotation={med} delay={0} fromX={0} tone="text-signal" />
      <Gear teeth={SMALL} cx={xSmall} rotation={small} delay={0.22} fromX={-(rMed + rSmall)} tone="text-foreground/70" />
    </div>
  )
}
