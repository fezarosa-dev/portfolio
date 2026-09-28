'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { remarkDriveImages } from '@/lib/markdown/remark-drive-images'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { DriveMedia } from '@/lib/drive'

const CLASS_NAME =
  'prose dark:prose-invert max-w-none break-words prose-headings:font-display prose-headings:tracking-tight prose-a:text-signal prose-a:no-underline prose-strong:text-foreground prose-hr:border-hairline prose-blockquote:border-signal prose-pre:overflow-x-auto prose-img:mx-auto'

const VIDEO_EXTENSION_RE = /\.(mp4|webm|mov|ogv)(\?|#|$)/i

const MarkdownImage: Components['img'] = ({ src, alt }) => {
  const isVideo =
    typeof src === 'string' && (src.startsWith('/api/drive-video/') || VIDEO_EXTENSION_RE.test(src))
  if (isVideo) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={src} controls playsInline className="mx-auto max-w-full rounded-lg" />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} />
}

// revela cada bloco (parágrafo, item de lista, título, citação) sozinho
// conforme entra na tela, em vez do markdown inteiro de uma vez -- usado no
// currículo, artigos e páginas de projeto, que costumam ser textos longos
// onde uma única animação no topo passa desapercebida ao rolar
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

export function MarkdownContent({
  content,
  driveImages,
}: {
  content: string
  driveImages: DriveMedia[]
}) {
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
    <div className={CLASS_NAME}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkDriveImages, driveImages]]}
        components={{
          img: MarkdownImage,
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
