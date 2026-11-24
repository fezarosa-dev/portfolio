import type { Company, Language, Project } from './supabase/queries.ts'

// detalhes da seção "o que já foi entregue" (fim da home no celular), calculados dos projetos visíveis

/** As tecnologias mais usadas nos projetos (por quantos projetos usam; empate segue a ordem do painel). */
export function topTechnologies(projects: Pick<Project, 'languages'>[], limit: number): Language[] {
  const uses = new Map<string, { lang: Language; count: number }>()
  for (const p of projects)
    for (const lang of p.languages) {
      const entry = uses.get(lang.id) ?? { lang, count: 0 }
      entry.count++
      uses.set(lang.id, entry)
    }
  return [...uses.values()]
    .sort((a, b) => b.count - a.count || a.lang.position - b.lang.position)
    .slice(0, limit)
    .map((e) => e.lang)
}

/** As empresas dos projetos, sem repetir, da que tem mais projetos pra menos. */
export function projectCompanies(projects: Pick<Project, 'company'>[]): Company[] {
  const byId = new Map<string, { company: Company; count: number }>()
  for (const { company } of projects) {
    if (!company) continue
    const entry = byId.get(company.id) ?? { company, count: 0 }
    entry.count++
    byId.set(company.id, entry)
  }
  return [...byId.values()].sort((a, b) => b.count - a.count).map((e) => e.company)
}
