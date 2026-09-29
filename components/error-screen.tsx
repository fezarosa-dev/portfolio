import Image from 'next/image'

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
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-steel">{text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
      {footer}
    </main>
  )
}
