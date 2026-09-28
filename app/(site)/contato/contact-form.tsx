'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Dictionary } from '@/lib/i18n'

const CATEGORIES = ['vaga', 'projeto', 'duvida', 'outro'] as const
const MAX_MESSAGE = 4000

export function ContactForm({
  dict,
  defaultCategory,
  defaultSubject,
}: {
  dict: Dictionary['contato']
  defaultCategory?: (typeof CATEGORIES)[number]
  defaultSubject?: string
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [length, setLength] = useState(0)
  const { enabled: reduceMotion } = useReduceMotion()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const formData = new FormData(form)
    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        category: formData.get('category'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      }),
    })
    if (res.ok) {
      setStatus('sent')
      setLength(0)
      form.reset()
      return
    }
    const data = await res.json().catch(() => null)
    setErrorMessage(data?.error || dict.error)
    setStatus('error')
  }

  if (status === 'sent') {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start gap-4 py-4"
      >
        <CheckCircle2 className="h-10 w-10 text-status" />
        <p className="text-base text-status">{dict.sent}</p>
        <Button type="button" variant="outline" onClick={() => setStatus('idle')}>
          {dict.sendAnother}
        </Button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{dict.categoryLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((key, i) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={key}
                required={i === 0}
                defaultChecked={key === defaultCategory}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-input px-3.5 py-1.5 text-sm transition-colors hover:border-signal peer-checked:border-signal peer-checked:bg-signal peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {dict.categories[key]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">{dict.nameLabel}</Label>
          <Input id="contact-name" name="name" placeholder={dict.namePlaceholder} required className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">{dict.emailLabel}</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder={dict.emailPlaceholder}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-subject">{dict.subjectLabel}</Label>
        <Input
          id="contact-subject"
          name="subject"
          defaultValue={defaultSubject}
          placeholder={dict.subjectPlaceholder}
          required
          maxLength={120}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">{dict.messageLabel}</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder={dict.messagePlaceholder}
          required
          maxLength={MAX_MESSAGE}
          onChange={(e) => setLength(e.target.value.length)}
          className="min-h-64 resize-y px-3 py-2.5 leading-relaxed [field-sizing:fixed]"
        />
        <p className="self-end font-mono text-xs text-steel">
          {length}/{MAX_MESSAGE}
        </p>
      </div>

      <Button type="submit" size="lg" disabled={status === 'sending'} className="h-11 w-fit px-5 text-base">
        {status === 'sending' ? dict.sending : dict.send}
        <Send className="ml-1.5 h-4 w-4" />
      </Button>
      {status === 'error' && <p className="font-mono text-sm text-destructive">{errorMessage}</p>}
    </form>
  )
}
