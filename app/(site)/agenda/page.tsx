import type { Metadata } from 'next'
import { SplitTitle } from '@/components/split-title'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

const SCHEDULE_EMBED =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3LgAE5XjA89aUgSlEv71TGibSDDogBlrGxcHgALmT6SsOtX6a8Er3BQ0glW97xNsbBqpr94qEF?gv=true'

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getDictionary()
  return pageMetadata(locale, '/agenda', dict.contato.scheduleTitle, dict.contato.scheduleText)
}

export default async function AgendaPage() {
  const { dict } = await getDictionary()
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <FadeIn>
        <Eyebrow>{dict.contato.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl"><SplitTitle text={dict.contato.scheduleTitle} /></h1>
        <p className="mt-4 max-w-xl text-lg text-steel">{dict.contato.scheduleText}</p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <iframe
          src={SCHEDULE_EMBED}
          title={dict.contato.scheduleTitle}
          className="mt-10 h-[700px] w-full rounded-lg border border-hairline bg-white"
          loading="lazy"
        />
      </FadeIn>
    </main>
  )
}
