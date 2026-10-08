'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useReduceMotion } from '@/components/reduce-motion-provider'
import { takeHandoff } from '@/lib/handoff'
import type { Dictionary } from '@/lib/i18n'

const CATEGORIES = ['vaga', 'projeto', 'duvida', 'outro'] as const
const MAX_MESSAGE = 4000
const MIN_HEIGHT = 176
const MAX_HEIGHT = 720
const EASE = [0.22, 1, 0.36, 1] as const
const FLIGHT_MS = 1000 // tempo mínimo do avião sair voando antes de mostrar a confirmação
const FLIGHT = { x: 150, y: -95 }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Confirmação de envio: círculo e check se desenham, um anel estoura e o texto sobe.
function SentConfirmation({
  dict,
  onAgain,
  reduce,
}: {
  dict: Dictionary['contato']
  onAgain: () => void
  reduce: boolean
}) {
  const draw = (delay: number, duration: number) =>
    reduce
      ? { initial: false as const }
      : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration, delay, ease: EASE } }
  return (
    <div role="status" className="flex flex-col items-start gap-4 py-4">
      <div className="relative h-16 w-16">
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-status"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' }}
          />
        )}
        <svg
          viewBox="0 0 64 64"
          className="h-16 w-16 text-status"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <motion.circle cx="32" cy="32" r="28" {...draw(0, 0.6)} />
          <motion.path d="M19 33 l9 9 l17 -19" {...draw(0.45, 0.45)} />
        </svg>
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: reduce ? 0 : 0.7, ease: EASE }}
        className="flex flex-col gap-1"
      >
        <p className="text-xl font-medium text-status">{dict.sentTitle}</p>
        <p className="text-sm text-steel">{dict.sentText}</p>
      </motion.div>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduce ? 0 : 1 }}
      >
        <Button type="button" variant="outline" onClick={onAgain}>
          {dict.sendAnother}
        </Button>
      </motion.div>
    </div>
  )
}

export function ContactForm({ dict }: { dict: Dictionary['contato'] }) {
  const [category, setCategory] = useState<string>()
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [length, setLength] = useState(0)
  const { enabled: reduceMotion } = useReduceMotion()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [dragging, setDragging] = useState(false)
  const plane = useAnimationControls()
  const trail = useAnimationControls()

  // categoria/assunto vindos dos botões de Serviços (sem passar pela URL)
  useEffect(() => {
    const h = takeHandoff<{ categoria?: string; assunto?: string }>('contato')
    if (!h) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setCategory(h.categoria)
    setSubject((h.assunto ?? '').slice(0, 120))
    /* eslint-enable react-hooks/set-state-in-effect */
    document.getElementById('formulario')?.scrollIntoView()
  }, [])

  // alça própria de redimensionar (a nativa do navegador não dá pra estilizar): arrasta pra mudar a altura
  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    const el = textareaRef.current!
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    setDragging(true)
    const startY = e.clientY
    const startHeight = el.offsetHeight
    const move = (ev: PointerEvent) => {
      el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + ev.clientY - startY))}px`
    }
    const end = () => {
      setDragging(false)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const formData = new FormData(form)
    // o avião de papel pega impulso, sai voando do botão deixando um rastro; o envio acontece em paralelo
    const flight = reduceMotion
      ? Promise.resolve()
      : (async () => {
          trail.start({
            scaleX: [0, 1],
            opacity: [0, 0.9, 0],
            transition: { duration: 0.9, delay: 0.18, ease: 'easeOut', times: [0, 0.35, 1] },
          })
          await plane.start({
            x: [0, -7, FLIGHT.x],
            y: [0, 5, FLIGHT.y],
            scale: [1, 0.9, 0.35],
            rotate: [0, 0, -12],
            opacity: [1, 1, 0],
            transition: { duration: 0.85, times: [0, 0.22, 1], ease: ['easeOut', 'easeIn'] },
          })
          await wait(FLIGHT_MS - 850)
        })()
    const [res] = await Promise.all([
      fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          category: formData.get('category'),
          subject: formData.get('subject'),
          message: formData.get('message'),
          website: formData.get('website'),
        }),
      }),
      flight,
    ])
    if (res.ok) {
      setStatus('sent')
      setLength(0)
      form.reset()
      setCategory(undefined)
      setSubject('')
      return
    }
    const data = await res.json().catch(() => null)
    setErrorMessage(data?.error || dict.error)
    setStatus('error')
    // deu erro: o avião volta voando pro botão
    if (!reduceMotion) {
      plane.set({ x: -FLIGHT.x / 2, y: -FLIGHT.y / 2, scale: 0.5, rotate: 0, opacity: 0 })
      plane.start({ x: 0, y: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 14 } })
    }
  }

  if (status === 'sent') {
    return <SentConfirmation dict={dict} reduce={reduceMotion} onAgain={() => setStatus('idle')} />
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* campo-armadilha anti-robô: escondido de pessoas e de leitores de tela, o servidor descarta quem preencher */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
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
                checked={category === key}
                onChange={() => setCategory(key)}
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
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={dict.subjectPlaceholder}
          required
          maxLength={120}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">{dict.messageLabel}</Label>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            id="contact-message"
            name="message"
            placeholder={dict.messagePlaceholder}
            required
            maxLength={MAX_MESSAGE}
            onChange={(e) => setLength(e.target.value.length)}
            style={{
              height: 256,
              minHeight: MIN_HEIGHT,
              maxHeight: MAX_HEIGHT,
              fieldSizing: 'fixed',
              scrollbarGutter: 'stable',
            }}
            className="thin-scroll resize-none overflow-y-auto overscroll-contain px-3 py-2.5 pb-7 leading-relaxed"
          />
          <div
            data-cursor="hover"
            onPointerDown={startResize}
            title="Arraste para ajustar a altura"
            className="group absolute bottom-1.5 right-1.5 grid h-6 w-8 touch-none place-items-center"
          >
            <span
              className={`h-1.5 w-6 rounded-full transition-[background-color,width] duration-200 ${
                dragging ? 'w-8 bg-signal' : 'bg-foreground/30 group-hover:w-8 group-hover:bg-signal'
              }`}
            />
          </div>
        </div>
        <p className="self-end font-mono text-xs text-steel">
          {length}/{MAX_MESSAGE}
        </p>
      </div>

      <Button type="submit" size="lg" disabled={status === 'sending'} className="relative h-11 w-fit px-5 text-base disabled:cursor-wait disabled:opacity-100">
        {status === 'sending' ? dict.sending : dict.send}
        <span className="relative ml-1.5 inline-flex">
          {/* rastro do voo: linha que acompanha a trajetória do avião */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-px origin-left bg-gradient-to-r from-signal to-transparent"
            style={{
              width: Math.hypot(FLIGHT.x, FLIGHT.y),
              rotate: (Math.atan2(FLIGHT.y, FLIGHT.x) * 180) / Math.PI,
              opacity: 0,
              scaleX: 0,
            }}
            animate={trail}
          />
          <motion.span className="inline-flex" animate={plane}>
            <Send className="h-4 w-4" />
          </motion.span>
        </span>
      </Button>
      {status === 'error' && <p className="font-mono text-sm text-destructive">{errorMessage}</p>}
    </form>
  )
}
