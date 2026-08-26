import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getProjectById, getSiteContent } from '@/lib/supabase/queries'
import { listDriveMedia, parseDriveFolderId } from '@/lib/drive'
import { iconUrl } from '@/lib/icons'
import { getDictionary, getLocale } from '@/lib/i18n'
import { resolveText } from '@/lib/bilingual'
import { localizedAlternates } from '@/lib/seo'
import { MarkdownContent } from '@/components/markdown-content'
import { AuthorNames } from '@/components/author-names'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const [project, locale] = await Promise.all([getProjectById(id), getLocale()])
  if (!project || project.click_mode === 'link') return {}

  const title = resolveText(project.title, project.title_en, locale)
  const summary = resolveText(project.summary, project.summary_en, locale)

  return {
    title,
    description: summary || `Projeto ${title}, por Felipe Zanoni da Rosa.`,
    alternates: localizedAlternates(locale, `/projetos/${project.id}`),
  }
}

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectById(id)
  if (!project) notFound()
  if (project.click_mode === 'link') notFound()

  const [content, { dict, locale }] = await Promise.all([getSiteContent(), getDictionary()])
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  const driveImages = folderId ? await listDriveMedia(folderId) : []
  const title = resolveText(project.title, project.title_en, locale)
  const contentMd = resolveText(project.content_md, project.content_md_en, locale)

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <FadeIn>
        <Link href={`/${locale}/projetos`} className="font-mono text-xs text-steel hover:text-signal">
          {dict.projetos.back}
        </Link>
        <Eyebrow>{dict.projetos.detailEyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{title}</h1>
        {project.authors.length > 0 && (
          <p className="mt-2 font-mono text-sm font-medium text-foreground/80">
            {dict.projetos.with} <AuthorNames authors={project.authors} />
          </p>
        )}
        {project.company && (
          <p className="mt-1 font-mono text-sm font-medium text-foreground/80">
            {dict.projetos.at}{' '}
            {project.company.url ? (
              <a
                href={project.company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-signal hover:underline"
              >
                {resolveText(project.company.name, project.company.name_en, locale)}
              </a>
            ) : (
              resolveText(project.company.name, project.company.name_en, locale)
            )}
          </p>
        )}
        {(project.repo_url || project.site_url) && (
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-hairline px-3 py-1 text-steel hover:border-signal hover:text-signal"
              >
                {dict.projetos.repo}
              </a>
            )}
            {project.site_url && (
              <a
                href={project.site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-hairline px-3 py-1 text-steel hover:border-signal hover:text-signal"
              >
                {dict.projetos.site}
              </a>
            )}
          </div>
        )}
        {project.languages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.languages.map((lang) => (
              <Link
                key={lang.id}
                href={`/${locale}/projetos?tech=${lang.id}`}
                title={`Ver projetos com ${lang.name}`}
                className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-mono text-xs text-steel hover:border-signal hover:text-signal"
              >
                {lang.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                    alt=""
                    className="h-3.5 w-3.5"
                  />
                )}
                {lang.name}
              </Link>
            ))}
          </div>
        )}
      </FadeIn>
      <div className="mt-10">
        <MarkdownContent content={contentMd} driveImages={driveImages} />
      </div>
    </main>
  )
}
