import type { Metadata } from 'next'
import { getSiteContent, getVisibleProjects, getLanguages, getLanguageCategories, getContactLinks } from '@/lib/supabase/queries-cached'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { localizedAlternates } from '@/lib/seo'
import { pageText } from '@/lib/page-texts'
import { projectTechRows } from '@/lib/site-keys'
import { countClients } from '@/lib/company-count'
import { HeroSection } from '@/components/home/hero-section'
import { AboutTeaser } from '@/components/home/about-teaser'
import { ProjectsStory } from '@/components/home/projects-3d/projects-story'
import { ContactTeaser } from '@/components/home/contact-teaser'
import { jsonLd } from '@/lib/json-ld'

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: localizedAlternates(await getLocale(), '') }
}

export default async function HomePage() {
  const [content, projects, languages, categories, links, { dict, locale }] = await Promise.all([
    getSiteContent(),
    getVisibleProjects(),
    getLanguages(),
    getLanguageCategories(),
    getContactLinks(),
    getDictionary(),
  ])

  const heroSubtitle = resolveText(content.hero_subtitle ?? '', content.hero_subtitle_en, locale)
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Felipe Zanoni da Rosa',
    url: 'https://www.zanoni.dev.br',
    jobTitle: heroSubtitle || 'Software Engineer',
    sameAs: ['https://github.com/fezarosa-dev', 'https://www.linkedin.com/in/felipe-zanoni/'],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd) }}
      />
      <HeroSection
        title={resolveText(content.hero_title ?? '', content.hero_title_en, locale)}
        subtitle={heroSubtitle}
        tagline={pageText(content, locale, 'hero_tagline')}
        languages={languages.filter((lang) => lang.show_on_home)}
        whoamiLabel={dict.home.whoami}
        locale={locale}
      />
      <AboutTeaser
        text={resolveText(content.sobre_texto ?? '', content.sobre_texto_en, locale)}
        eyebrow={dict.home.aboutEyebrow}
      />
      <ProjectsStory
        stats={{
          projects: projects.length,
          technologies: languages.length,
          companies: countClients(projects),
        }}
        categories={categories}
        projects={projects.filter((p) => p.show_on_home)}
        eyebrow={dict.home.projectsEyebrow}
        heading={dict.home.projectsHeading}
        seeAll={dict.home.seeAll}
        withLabel={dict.projetos.with}
        atLabel={dict.projetos.at}
        locale={locale}
        maxTechRows={projectTechRows(content)}
      />
      {/* o foguete termina com "Vamos construir o seu?": o contato vem logo em seguida (a busca segue em /busca) */}
      <ContactTeaser links={links} content={content} dict={dict} locale={locale} />
    </>
  )
}
