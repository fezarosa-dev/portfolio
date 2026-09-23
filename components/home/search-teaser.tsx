import { SearchPanel } from '@/components/search/search-panel'
import { Eyebrow } from '@/components/eyebrow'
import type { Locale } from '@/lib/i18n'

export function SearchTeaser({
  locale,
  eyebrow,
  placeholder,
  noResultsLabel,
}: {
  locale: Locale
  eyebrow: string
  placeholder: string
  noResultsLabel: string
}) {
  return (
    <section className="mx-auto max-w-xl px-6 py-16">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-4">
        <SearchPanel locale={locale} placeholder={placeholder} noResultsLabel={noResultsLabel} />
      </div>
    </section>
  )
}
