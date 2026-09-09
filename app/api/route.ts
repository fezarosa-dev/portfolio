import { NextResponse, type NextRequest } from 'next/server'
import {
  getSiteContent,
  getVisibleProjects,
  getVisibleArticles,
  getResume,
  getResumeLinks,
  getContactLinks,
} from '@/lib/supabase/queries-cached'
import { resolveText } from '@/lib/bilingual'
import { detectLocaleFromAcceptLanguage } from '@/lib/i18n/detect-locale'
import type { Locale } from '@/lib/i18n/dictionaries'

const SITE_URL = 'https://www.zanoni.dev.br'
const SITE_NAME = 'Felipe Zanoni da Rosa'

function resolveLocale(request: NextRequest): Locale {
  const param = request.nextUrl.searchParams.get('locale')
  if (param === 'pt' || param === 'en') return param
  return detectLocaleFromAcceptLanguage(request.headers.get('accept-language') ?? '')
}

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request)
  const [content, projects, articles, resume, resumeLinks, contactLinks] = await Promise.all([
    getSiteContent(),
    getVisibleProjects(),
    getVisibleArticles(),
    getResume(),
    getResumeLinks(),
    getContactLinks(),
  ])

  const data = {
    site: SITE_URL,
    name: SITE_NAME,
    generated_at: new Date().toISOString(),
    headline: resolveText(content.hero_title ?? null, content.hero_title_en ?? null, locale),
    subtitle: resolveText(content.hero_subtitle ?? null, content.hero_subtitle_en ?? null, locale),
    about: resolveText(content.sobre_texto ?? null, content.sobre_texto_en ?? null, locale),
    services: resolveText(content.servicos_texto ?? null, content.servicos_texto_en ?? null, locale),
    availability: resolveText(content.status_text ?? null, content.status_text_en ?? null, locale),
    contact: {
      email: content.contato_email || null,
      phone: content.contato_telefone || null,
      github: content.link_github || null,
      linkedin: content.link_linkedin || null,
      other_links: contactLinks.map((link) => ({
        label: resolveText(link.label, link.label_en, locale),
        url: link.url,
      })),
      page: `${SITE_URL}/${locale}/contato`,
    },
    resume: {
      content_md: resolveText(resume.content_md, resume.content_md_en, locale),
      links: resumeLinks.map((link) => ({
        label: resolveText(link.label, link.label_en, locale),
        url: link.url,
      })),
      page: `${SITE_URL}/${locale}/curriculo`,
    },
    projects: projects.map((project) => ({
      title: resolveText(project.title, project.title_en, locale),
      summary: resolveText(project.summary, project.summary_en, locale),
      description: resolveText(project.content_md, project.content_md_en, locale),
      technologies: project.languages.map((lang) => lang.name),
      coauthors: project.authors.map((author) => ({ name: author.name, url: author.url })),
      company: project.company
        ? resolveText(project.company.name, project.company.name_en, locale)
        : null,
      repo_url: project.repo_url,
      site_url: project.site_url,
      page:
        project.click_mode === 'link'
          ? project.click_url
          : `${SITE_URL}/${locale}/projetos/${project.id}`,
    })),
    articles: articles.map((article) => ({
      title: resolveText(article.title, article.title_en, locale),
      summary: resolveText(article.summary, article.summary_en, locale),
      content_md: resolveText(article.content_md, article.content_md_en, locale),
      page: `${SITE_URL}/${locale}/artigos/${article.id}`,
    })),
  }

  return NextResponse.json(data)
}
