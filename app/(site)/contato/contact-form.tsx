'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import type { Dictionary } from '@/lib/i18n'

export function ContactForm({ dict }: { dict: Dictionary['contato'] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { enabled: reduceMotion } = useReduceMotion()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const formData = new FormData(e.currentTarget)
    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      }),
    })
    if (res.ok) {
      setStatus('sent')
      e.currentTarget.reset()
      return
    }
    const data = await res.json().catch(() => null)
    setErrorMessage(data?.error || dict.error)
    setStatus('error')
  }

  if (status === 'sent') {
    return (
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="font-mono text-sm text-status"
      >
        {dict.sent}
      </motion.p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-name">{dict.nameLabel}</Label>
        <Input id="contact-name" name="name" placeholder={dict.namePlaceholder} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-email">{dict.emailLabel}</Label>
        <Input id="contact-email" name="email" type="email" placeholder={dict.emailPlaceholder} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">{dict.messageLabel}</Label>
        <Textarea id="contact-message" name="message" placeholder={dict.messagePlaceholder} required rows={5} />
      </div>
      <Button type="submit" disabled={status === 'sending'} className="w-fit">
        {status === 'sending' ? dict.sending : dict.send}
      </Button>
      {status === 'error' && <p className="font-mono text-sm text-destructive">{errorMessage}</p>}
    </form>
  )
}
