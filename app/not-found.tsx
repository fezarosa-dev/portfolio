import Link from 'next/link'
import { getLocale } from '@/lib/i18n'
import { NotFoundContent } from '@/components/not-found-content'

// URL que não casa com nenhuma rota: aqui não tem o layout do site, então leva um cabeçalho mínimo
export default async function NotFound() {
  const locale = await getLocale()
  return (
    <div className="site-warm flex min-h-screen flex-1 flex-col bg-background text-foreground">
      <header className="px-6 py-4">
        <Link href={`/${locale}`} className="font-mono text-sm font-medium tracking-tight">
          zanoni<span className="text-signal">.dev.br</span>
        </Link>
      </header>
      <NotFoundContent />
    </div>
  )
}
