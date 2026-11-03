import Image from 'next/image'
import { HOUSTON } from '@/lib/houston'

// Tela de erro (404/500) com o cachorro mascote: acordado ("não achei") ou dormindo no teclado ("quebrou").
export function ErrorScreen({
  code,
  title,
  text,
  dog,
  children,
  footer,
}: {
  code: string
  title: string
  text: string
  dog: 'awake' | 'sleeping'
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src={dog === 'awake' ? '/img/mascote-cachorro-acordado.svg' : '/img/mascote-cachorro.svg'}
        alt=""
        aria-hidden
        width={371}
        height={672}
        priority
        className={dog === 'awake' ? 'h-44 w-auto' : 'h-64 w-auto -my-16'}
      />
      <p className="mt-2 text-7xl text-signal [font-family:var(--font-hero)] sm:text-9xl">{code}</p>
      {/* a frase da Apollo 13 em toda tela de erro (a home conta a história de um lançamento) */}
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-signal">“{HOUSTON}”</p>
      <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-steel">{text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
      {footer}
    </main>
  )
}
