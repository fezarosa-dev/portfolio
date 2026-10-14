import type { Locale } from '@/lib/i18n/dictionaries'
import { resolveText } from './bilingual.ts'

// --- linhas cruas do banco -------------------------------------------------

export type ResumeProfileRow = {
  full_name: string | null
  headline: string | null
  headline_en: string | null
  location: string | null
  location_en: string | null
  summary: string | null
  summary_en: string | null
}

export type ResumeExperienceRow = {
  id: string
  company_id: string | null
  role: string | null
  role_en: string | null
  start_year: number
  start_month: number | null
  end_year: number | null
  end_month: number | null
  topics: string | null
  topics_en: string | null
  position: number
}

export type ResumeEducationRow = {
  id: string
  degree: string | null
  degree_en: string | null
  institution: string | null
  institution_en: string | null
  year: string | null
  position: number
}

export type ResumeSpokenLanguageRow = {
  id: string
  language: string | null
  language_en: string | null
  level: string | null
  level_en: string | null
  position: number
}

export type ResumeCertificationRow = {
  id: string
  name: string | null
  name_en: string | null
  start_year: number | null
  start_month: number | null
  end_year: number | null
  end_month: number | null
  position: number
}

export type ResumeSkillCategoryRow = {
  id: string
  name: string | null
  name_en: string | null
  position: number
}

export type ResumeSkillRow = {
  id: string
  category_id: string
  language_id: string | null
  label: string | null
  label_en: string | null
  position: number
}

export type ResumeProjectRow = {
  id: string
  title: string | null
  title_en: string | null
  resume_what: string | null
  resume_what_en: string | null
  resume_with: string | null
  resume_with_en: string | null
  resume_solves: string | null
  resume_solves_en: string | null
  resume_position: number
  /** tecnologias vinculadas ao projeto, por id */
  project_languages?: { language_id: string }[]
}

export type ResumeSource = {
  profile: ResumeProfileRow | null
  contact: { email: string; phone: string; links: string[] }
  experiences: ResumeExperienceRow[]
  companies: { id: string; name: string | null; name_en: string | null }[]
  projects: ResumeProjectRow[]
  education: ResumeEducationRow[]
  spoken: ResumeSpokenLanguageRow[]
  categories: ResumeSkillCategoryRow[]
  skills: ResumeSkillRow[]
  /** nome das tecnologias vinculadas, por id (habilidades que apontam pra uma tecnologia) */
  technologies: Record<string, { name: string; name_en: string | null }>
  certifications: ResumeCertificationRow[]
}

// --- modelo pronto pra renderizar (HTML e PDF usam o mesmo) -----------------

export type Resume = {
  name: string
  headline: string
  contactLines: string[]
  summary: string
  experiences: { title: string; company: string; range: string; topics: string[] }[]
  projects: { title: string; what: string; with: string; solves: string }[]
  education: { degree: string; institution: string; year: string }[]
  spoken: { language: string; level: string }[]
  skills: { category: string; items: string[] }[]
  certifications: { name: string; range: string }[]
}

export const RESUME_LABELS = {
  pt: {
    summary: 'Resumo Profissional',
    experience: 'Experiência Profissional',
    projects: 'Projetos',
    education: 'Formação Acadêmica',
    languages: 'Idiomas',
    skills: 'Habilidades Técnicas',
    certifications: 'Treinamentos e Certificações Adicionais',
    what: 'O quê',
    with: 'Com quê',
    solves: 'Resolve',
    current: 'Atual',
  },
  en: {
    summary: 'Professional Summary',
    experience: 'Professional Experience',
    projects: 'Projects',
    education: 'Education',
    languages: 'Languages',
    skills: 'Technical Skills',
    certifications: 'Additional Training and Certifications',
    what: 'What',
    with: 'With',
    solves: 'Solves',
    current: 'Present',
  },
} as const

const MONTHS = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const

/** "Mai 2026" — ou só "2026" quando não há mês. */
export function formatDate(year: number | null, month: number | null, locale: Locale): string {
  if (year === null) return ''
  return month ? `${MONTHS[locale][month - 1]} ${year}` : String(year)
}

/**
 * Intervalo "início – fim". Sem fim: experiência é "Atual"/"Present" (openEndLabel);
 * certificação mostra só a data de início.
 */
export function formatRange(
  start: { year: number | null; month: number | null },
  end: { year: number | null; month: number | null },
  locale: Locale,
  openEndLabel?: string,
  separator = ' – '
): string {
  const from = formatDate(start.year, start.month, locale)
  const to = end.year !== null ? formatDate(end.year, end.month, locale) : (openEndLabel ?? '')
  return [from, to].filter(Boolean).join(separator)
}

/** Um tópico por linha; ignora linhas vazias e remove marcadores "- " / "• " colados à mão. */
export function splitLines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s+/, '').trim())
    .filter(Boolean)
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

export function buildResume(src: ResumeSource, locale: Locale): Resume {
  const t = (pt: string | null, en: string | null) => resolveText(pt, en, locale).trim()
  const labels = RESUME_LABELS[locale]
  const companyName = new Map(src.companies.map((c) => [c.id, t(c.name, c.name_en)]))
  const profile = src.profile
  const techName = (id: string) => {
    const tech = src.technologies[id]
    return tech ? t(tech.name, tech.name_en) : ''
  }

  const contactLines = [
    [t(profile?.location ?? null, profile?.location_en ?? null), src.contact.phone, src.contact.email].filter(Boolean),
    src.contact.links,
  ]
    .map((parts) => parts.join('  |  '))
    .filter(Boolean)

  const itemsByCategory = new Map<string, ResumeSkillRow[]>()
  for (const skill of src.skills) {
    itemsByCategory.set(skill.category_id, [...(itemsByCategory.get(skill.category_id) ?? []), skill])
  }

  return {
    name: profile?.full_name?.trim() ?? '',
    headline: t(profile?.headline ?? null, profile?.headline_en ?? null),
    contactLines,
    summary: t(profile?.summary ?? null, profile?.summary_en ?? null),
    experiences: [...src.experiences].sort(byPosition).map((e) => ({
      title: t(e.role, e.role_en),
      company: e.company_id ? (companyName.get(e.company_id) ?? '') : '',
      range: formatRange(
        { year: e.start_year, month: e.start_month },
        { year: e.end_year, month: e.end_month },
        locale,
        labels.current
      ),
      topics: splitLines(resolveText(e.topics, e.topics_en, locale)),
    })),
    projects: [...src.projects]
      .sort((a, b) => a.resume_position - b.resume_position)
      .map((p) => ({
        title: t(p.title, p.title_en),
        what: t(p.resume_what, p.resume_what_en),
        // sem texto próprio, "Com quê" lista as tecnologias vinculadas ao projeto (por id, no idioma da página)
        with: t(p.resume_with, p.resume_with_en) || (p.project_languages ?? []).map((l) => techName(l.language_id)).filter(Boolean).join(', '),
        solves: t(p.resume_solves, p.resume_solves_en),
      })),
    education: [...src.education].sort(byPosition).map((e) => ({
      degree: t(e.degree, e.degree_en),
      institution: t(e.institution, e.institution_en),
      year: e.year?.trim() ?? '',
    })),
    spoken: [...src.spoken].sort(byPosition).map((s) => ({
      language: t(s.language, s.language_en),
      level: t(s.level, s.level_en),
    })),
    skills: [...src.categories]
      .sort(byPosition)
      .map((category) => ({
        category: t(category.name, category.name_en),
        items: (itemsByCategory.get(category.id) ?? [])
          .sort(byPosition)
          .map((s) => (s.language_id ? techName(s.language_id) : t(s.label, s.label_en)))
          .filter(Boolean),
      }))
      .filter((c) => c.items.length > 0),
    certifications: [...src.certifications].sort(byPosition).map((c) => ({
      name: t(c.name, c.name_en),
      // certificação: "2022–2023" colado, pra não ficar "Nome – 2022 – 2023"
      range: formatRange({ year: c.start_year, month: c.start_month }, { year: c.end_year, month: c.end_month }, locale, undefined, '–'),
    })),
  }
}

/** true quando já há conteúdo estruturado o bastante pra substituir o currículo em Markdown. */
export function hasStructuredResume(resume: Resume): boolean {
  return resume.experiences.length > 0 || resume.projects.length > 0 || resume.education.length > 0
}
