import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getVisibleProjects } from '@/lib/supabase/queries'
import { getDictionary, getLocale } from '@/lib/i18n'
import { ProjectsExplorer } from '@/components/projects-explorer'
import { PAGE_SEO, pageMetadata } from '@/lib/seo'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = PAGE_SEO.projetos[locale]
  return pageMetadata(locale, '/projetos', seo.title, seo.description)
}

export default async function ProjetosPage() {
  const [projects, { dict, locale }] = await Promise.all([getVisibleProjects(), getDictionary()])
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.projetos.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.projetos.title}</h1>
      </FadeIn>
      <div className="mt-10">
        <Suspense>
          <ProjectsExplorer projects={projects} dict={dict.projetos} locale={locale} />
        </Suspense>
      </div>
    </main>
  )
}
