import Link from 'next/link'
import { Toaster } from 'sonner'
import { signOut } from '../actions'
import { RepublishButton } from '@/components/admin/republish-button'
import { Button } from '@/components/ui/button'

const TABS = [
  { href: '/admin/projetos', label: 'Projetos', icon: '▣' },
  { href: '/admin/artigos', label: 'Artigos', icon: '▥' },
  { href: '/admin/tecnologias', label: 'Tecnologias', icon: '⌘' },
  { href: '/admin/autores', label: 'Autores', icon: '☺' },
  { href: '/admin/empresas', label: 'Empresas', icon: '⌂' },
  { href: '/admin/mensagens', label: 'Mensagens', icon: '✉' },
  { href: '/admin/contato', label: 'Contato', icon: '☎' },
  { href: '/admin/personalizacao', label: 'Personalização', icon: '✎' },
  { href: '/admin/curriculo', label: 'Currículo', icon: '▤' },
  { href: '/admin/imagens', label: 'Imagens', icon: '▨' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex shrink-0 flex-col border-hairline bg-card sm:w-56 sm:border-r">
        <div className="border-b border-hairline px-5 py-5">
          <p className="font-mono text-sm font-medium tracking-tight">
            zanoni<span className="text-signal">.admin</span>
          </p>
        </div>
        <nav className="flex flex-1 flex-row flex-wrap gap-1 p-3 sm:flex-col">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-signal"
            >
              <span className="font-mono text-signal" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-hairline p-3">
          <RepublishButton />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-background p-6 sm:p-10">{children}</main>
      <Toaster
        theme="light"
        position="bottom-right"
        toastOptions={{
          unstyled: false,
          classNames: {
            toast:
              '!bg-card !border !border-hairline !text-foreground !rounded-lg !shadow-lg !font-sans',
            title: '!font-medium',
            description: '!text-steel !font-mono !text-xs',
            actionButton: '!bg-signal !text-white',
            cancelButton: '!bg-secondary !text-foreground',
            closeButton: '!bg-card !border !border-hairline !text-steel',
          },
        }}
        icons={{
          success: <span className="text-status">●</span>,
          error: <span className="text-destructive">●</span>,
        }}
      />
    </div>
  )
}
