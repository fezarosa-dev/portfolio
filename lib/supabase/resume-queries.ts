import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { ResumeSource } from '@/lib/resume'

const SITE_HOST = 'zanoni.dev.br'
const stripProtocol = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

async function all<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Tudo que o currículo (página e PDF) precisa, numa leitura só. */
export async function getResumeSource(client?: SupabaseClient): Promise<ResumeSource> {
  const supabase = client ?? (await createClient())
  const [profile, content, experiences, companies, projects, education, spoken, categories, skills, languages, certifications] =
    await Promise.all([
      supabase
        .from('resume')
        .select('full_name, headline, headline_en, location, location_en, summary, summary_en')
        .limit(1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      all<{ key: string; value: string }>(
        supabase.from('site_content').select('key, value').in('key', ['contato_email', 'contato_telefone', 'link_github', 'link_linkedin'])
      ),
      all(supabase.from('resume_experiences').select('*')),
      all(supabase.from('companies').select('id, name, name_en')),
      all(
        supabase
          .from('projects')
          .select('id, title, title_en, resume_what, resume_what_en, resume_with, resume_with_en, resume_solves, resume_solves_en, resume_position, project_languages(language_id)')
          .eq('in_resume', true)
      ),
      all(supabase.from('resume_education').select('*')),
      all(supabase.from('resume_spoken_languages').select('*')),
      all(supabase.from('resume_skill_categories').select('*')),
      all(supabase.from('resume_skills').select('*')),
      all<{ id: string; name: string; name_en: string | null }>(supabase.from('languages').select('id, name, name_en')),
      all(supabase.from('resume_certifications').select('*')),
    ])

  const c = Object.fromEntries(content.map((row) => [row.key, row.value]))
  return {
    profile,
    contact: {
      email: c.contato_email ?? '',
      phone: c.contato_telefone ?? '',
      links: [SITE_HOST, c.link_linkedin && stripProtocol(c.link_linkedin), c.link_github && stripProtocol(c.link_github)].filter(
        Boolean
      ) as string[],
    },
    experiences,
    companies,
    projects,
    education,
    spoken,
    categories,
    skills,
    technologies: Object.fromEntries(languages.map((l) => [l.id, { name: l.name, name_en: l.name_en }])),
    certifications,
  } as ResumeSource
}
