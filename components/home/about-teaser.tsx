'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eyebrow } from '@/components/eyebrow'
import { useReduceMotion } from '@/components/reduce-motion-provider'

// revela cada parágrafo/item/título do markdown por conta própria conforme
// entra na tela, em vez do texto inteiro de uma vez -- funciona mesmo sendo
// tudo um bloco de markdown só, porque o react-markdown já separa cada tag
// (p, li, h*) num elemento de verdade; cada um observa sua própria entrada
// na viewport, então não tem risco de o começo do texto não aparecer ou de
// bugar quando o conteúdo (vindo do Supabase) mudar.
function useReveal() {
  const { enabled: reduceMotion } = useReduceMotion()
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }
}

export function AboutTeaser({ text, eyebrow }: { text: string; eyebrow: string }) {
  const reveal = useReveal()

  // onDrag/onAnimation* do DOM têm assinatura incompatível com as do Framer
  // Motion -- omitidos porque o motion.* nunca herda esses handlers do
  // react-markdown de qualquer forma
  type TagProps<T extends keyof React.JSX.IntrinsicElements> = Omit<
    ComponentPropsWithoutRef<T>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
  > & {
    node?: unknown
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="prose dark:prose-invert mt-4 max-w-none text-xl leading-relaxed prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }: TagProps<'p'>) => <motion.p {...reveal} {...props} />,
            li: ({ node, ...props }: TagProps<'li'>) => <motion.li {...reveal} {...props} />,
            h1: ({ node, ...props }: TagProps<'h1'>) => <motion.h1 {...reveal} {...props} />,
            h2: ({ node, ...props }: TagProps<'h2'>) => <motion.h2 {...reveal} {...props} />,
            h3: ({ node, ...props }: TagProps<'h3'>) => <motion.h3 {...reveal} {...props} />,
            blockquote: ({ node, ...props }: TagProps<'blockquote'>) => (
              <motion.blockquote {...reveal} {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </section>
  )
}
