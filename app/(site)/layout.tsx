import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { Mascote } from '@/components/mascote'
import { SudoEasterEgg } from '@/components/sudo-easter-egg'
import { SpinEasterEgg } from '@/components/spin-easter-egg'
import { CookieConsent } from '@/components/cookie-consent'
import { CommandPalette } from '@/components/search/command-palette'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { findDriveFile, parseDriveFolderId } from '@/lib/drive'
import { getDictionary, getLocale } from '@/lib/i18n'

const RICKROLL_FILENAME_DEFAULT = 'never_gonna_give-you_up.mp4'
const RICKROLL_CLICKS_DEFAULT = 3

const SITE_NAME = 'Felipe Zanoni da Rosa'
const SITE_URL = 'https://www.zanoni.dev.br'

const SEO_BY_LOCALE = {
  pt: {
    title: { default: 'Felipe Zanoni da Rosa — Desenvolvedor de Software Full Stack', template: '%s — Zanoni' },
    ogTitle: `${SITE_NAME} — Portfólio`,
    description:
      'Portfólio de Felipe Zanoni da Rosa, desenvolvedor de software full stack — projetos, artigos técnicos, currículo e contato.',
    keywords: [
      'Felipe Zanoni da Rosa',
      'desenvolvedor de software',
      'engenheiro de software',
      'portfólio de desenvolvedor',
      'desenvolvedor full stack',
      'projetos de software',
      'programador Brasil',
    ],
    ogLocale: 'pt_BR',
  },
  en: {
    title: { default: 'Felipe Zanoni da Rosa — Full Stack Software Developer', template: '%s — Zanoni' },
    ogTitle: `${SITE_NAME} — Portfolio`,
    description:
      'Portfolio of Felipe Zanoni da Rosa, full stack software developer — projects, technical articles, resume and contact.',
    keywords: [
      'Felipe Zanoni da Rosa',
      'software developer',
      'software engineer',
      'developer portfolio',
      'full stack developer',
      'software projects',
    ],
    ogLocale: 'en_US',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const [locale, content] = await Promise.all([getLocale(), getSiteContent()])
  const seo = SEO_BY_LOCALE[locale]
  const suffix = locale === 'en' ? '_en' : ''
  const title = content[`seo_home_title${suffix}`]?.trim() || seo.title.default
  const description = content[`seo_home_description${suffix}`]?.trim() || seo.description
  const keywordsOverride = content[`seo_home_keywords${suffix}`]?.trim()
  const keywords = keywordsOverride
    ? keywordsOverride.split(',').map((k) => k.trim()).filter(Boolean)
    : [...seo.keywords]

  return {
    title: { default: title, template: seo.title.template },
    description,
    keywords,
    openGraph: {
      type: 'website',
      locale: seo.ogLocale,
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      title: seo.ogTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description,
    },
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const rickrollFilename = content.rickroll_video_filename?.trim() || RICKROLL_FILENAME_DEFAULT
  const rickrollVideo = folderId ? await findDriveFile(folderId, rickrollFilename).catch(() => null) : null
  const rickrollClicks = Number(content.rickroll_clicks) || RICKROLL_CLICKS_DEFAULT
  const easterEggsAtivo = content.easter_eggs_ativo !== 'false'

  return (
    <>
      <Nav />
      {children}
      <Footer />
      <Mascote
        ativo={content.mascote_ativo === 'true'}
        rickrollVideoId={rickrollVideo?.id ?? null}
        rickrollClicks={rickrollClicks}
      />
      {easterEggsAtivo && (
        <>
          <SudoEasterEgg locale={locale} />
          <SpinEasterEgg />
        </>
      )}
      <CookieConsent />
      <CommandPalette
        locale={locale}
        title={dict.busca.title}
        placeholder={dict.busca.placeholder}
        noResultsLabel={dict.busca.noResults}
      />
    </>
  )
}
