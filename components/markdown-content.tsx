'use client'

import { motion } from 'framer-motion'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { remarkDriveImages } from '@/lib/markdown/remark-drive-images'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { DriveMedia } from '@/lib/drive'

const CLASS_NAME =
  'prose dark:prose-invert max-w-none break-words prose-headings:font-display prose-headings:tracking-tight prose-a:text-signal prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-hr:border-hairline prose-blockquote:border-signal prose-pre:overflow-x-auto prose-img:mx-auto'

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

export function MarkdownContent({
  content,
  driveImages,
}: {
  content: string
  driveImages: DriveMedia[]
}) {
  const { enabled: reduceMotion } = useReduceMotion()
  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkDriveImages, driveImages]]}
      components={{ img: MarkdownImage }}
    >
      {content}
    </ReactMarkdown>
  )

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={CLASS_NAME}
    >
      {markdown}
    </motion.div>
  )
}
