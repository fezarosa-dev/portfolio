'use client'

import { Eyebrow } from '@/components/eyebrow'
import { LitMarkdown } from '@/components/lit-markdown'

export function AboutTeaser({ text, eyebrow }: { text: string; eyebrow: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="prose dark:prose-invert mt-4 max-w-none text-xl leading-relaxed prose-a:text-signal prose-a:no-underline hover:prose-a:underline">
        <LitMarkdown text={text} />
      </div>
    </section>
  )
}
