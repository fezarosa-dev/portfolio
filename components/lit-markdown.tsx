'use client'

import { Children, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useReduceMotion } from '@/components/reduce-motion-provider'

const DIM = 0.18

function Unit({ progress, index, total, children }: { progress: MotionValue<number>; index: number; total: number; children: ReactNode }) {
  const opacity = useTransform(progress, [index / total, (index + 1) / total], [DIM, 1])
  return <motion.span style={{ opacity }}>{children}</motion.span>
}

// Parágrafo que "acende" palavra por palavra conforme rola: cada palavra sai de 18% de opacidade até 100%
// em sequência, acompanhando a posição do parágrafo na tela. Elementos inline (link, negrito) contam como uma unidade.
function LitText({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] })

  const units: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (typeof child === 'string') {
      for (const word of child.split(/(\s+)/)) {
        if (!word) continue
        if (/^\s+$/.test(word)) units.push(' ')
        else units.push(word)
      }
    } else units.push(child)
  }
  const items = units.filter((u) => u !== ' ')
  const total = Math.max(items.length, 1)
  let i = 0

  return (
    <p ref={ref}>
      {units.map((unit, k) =>
        unit === ' ' ? (
          ' '
        ) : (
          <Unit key={k} progress={scrollYProgress} index={i++} total={total}>
            {unit}
          </Unit>
        )
      )}
    </p>
  )
}

type PProps = Omit<ComponentPropsWithoutRef<'p'>, 'ref'> & { node?: unknown }

export function LitMarkdown({ text }: { text: string }) {
  const { enabled: reduce } = useReduceMotion()
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={reduce ? undefined : { p: ({ children }: PProps) => <LitText>{children}</LitText> }}
    >
      {text}
    </ReactMarkdown>
  )
}
