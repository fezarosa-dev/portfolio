import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { getDictionary } from '@/lib/i18n'
import { ErrorScreen } from '@/components/error-screen'
import { buttonVariants } from '@/components/ui/button'

export async function NotFoundContent() {
  const { dict, locale } = await getDictionary()
  return (
    <ErrorScreen code="404" title={dict.errors.notFoundTitle} text={dict.errors.notFoundText} dog="awake">
      <Link href={`/${locale}`} className={buttonVariants({ size: 'lg' })} data-slot="button">
        {dict.errors.home}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
      <Link href={`/${locale}/busca`} className={buttonVariants({ size: 'lg', variant: 'outline' })} data-slot="button">
        <Search className="mr-1 h-4 w-4" />
        {dict.errors.search}
      </Link>
    </ErrorScreen>
  )
}
