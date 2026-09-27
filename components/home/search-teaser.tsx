import { SearchPanel } from '@/components/search/search-panel'
import { Eyebrow } from '@/components/eyebrow'
import type { Locale } from '@/lib/i18n'

export function SearchTeaser({
  locale,
  eyebrow,
  title,
  subtitle,
  placeholder,
  noResultsLabel,
}: {
  locale: Locale
  eyebrow: string
  title: string
  subtitle: string
  placeholder: string
  noResultsLabel: string
}) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-4xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-lg text-steel">{subtitle}</p>
      <div className="mt-10">
        <SearchPanel locale={locale} placeholder={placeholder} noResultsLabel={noResultsLabel} />
      </div>
    </section>
  )
}
