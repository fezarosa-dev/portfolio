import type { Metadata } from 'next'
import { version as nextVersion } from 'next/package.json'
import { getDictionary, getLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getPageSeo } from '@/lib/seo-runtime'
import { getVisibleProjects, getVisibleArticles, getLanguages } from '@/lib/supabase/queries-cached'
import { getLanguages as getLanguagesLive } from '@/lib/supabase/queries'
import { createPublicClient } from '@/lib/supabase/public-client'
import { Eyebrow } from '@/components/eyebrow'
import { FadeIn } from '@/components/fade-in'

const REPO_URL = 'https://github.com/fezarosa-dev/portfolio'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const seo = await getPageSeo('status', locale)
  return pageMetadata(locale, '/status', seo.title, seo.description)
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string
  hint?: string
  href?: string
}) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-6">
      <p className="font-mono text-xs text-steel">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate font-mono text-2xl text-foreground transition-colors hover:text-signal"
        >
          {value}
        </a>
      ) : (
        <p className="mt-2 truncate font-mono text-2xl text-foreground">{value}</p>
      )}
      {hint && <p className="mt-1 truncate font-mono text-xs text-steel">{hint}</p>}
    </div>
  )
}

async function measureSupabaseLatencyMs(): Promise<number> {
  const start = Date.now()
  await getLanguagesLive(createPublicClient())
  return Date.now() - start
}

export default async function StatusPage() {
  const [{ dict }, projects, articles, languages, latencyMs] = await Promise.all([
    getDictionary(),
    getVisibleProjects(),
    getVisibleArticles(),
    getLanguages(),
    measureSupabaseLatencyMs(),
  ])

  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0].slice(0, 80)
  const branch = process.env.VERCEL_GIT_COMMIT_REF
  const region = process.env.VERCEL_REGION

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <FadeIn>
        <Eyebrow>{dict.status.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">{dict.status.title}</h1>
        <p className="mt-3 max-w-lg text-steel">{dict.status.subtitle}</p>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-10 grid gap-4 sm:grid-cols-2">
        <StatCard
          label={dict.status.deployLabel}
          value={sha ? sha.slice(0, 7) : dict.status.deployLocal}
          hint={commitMessage}
          href={sha ? `${REPO_URL}/commit/${sha}` : undefined}
        />
        <StatCard
          label={dict.status.branchLabel}
          value={branch ?? dict.status.branchLocal}
          hint={region}
        />
        <StatCard label={dict.status.latencyLabel} value={`${latencyMs}ms`} />
        <StatCard
          label={dict.status.runtimeLabel}
          value={`Node ${process.version}`}
          hint={`Next ${nextVersion}`}
        />
        <div className="rounded-lg border border-hairline bg-card p-6 sm:col-span-2">
          <p className="font-mono text-xs text-steel">{dict.status.contentLabel}</p>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
            <p className="font-mono text-2xl text-foreground">
              {projects.length} <span className="text-sm text-steel">{dict.status.projects}</span>
            </p>
            <p className="font-mono text-2xl text-foreground">
              {articles.length} <span className="text-sm text-steel">{dict.status.articles}</span>
            </p>
            <p className="font-mono text-2xl text-foreground">
              {languages.length} <span className="text-sm text-steel">{dict.status.technologies}</span>
            </p>
          </div>
        </div>
      </FadeIn>
    </main>
  )
}
