import type { Company, CompanyClient, Project } from './supabase/queries.ts'

type CountedProject = Pick<Project, 'client_id' | 'company'>

// a chave de quem é o cliente do projeto: o grupo, se tiver; senão a empresa; sem empresa, ninguém
const clientKey = (p: CountedProject) => (p.client_id ? `client:${p.client_id}` : p.company ? `company:${p.company.id}` : null)

/**
 * Quantos clientes/empresas os projetos representam: projeto num grupo de cliente conta pelo grupo; projeto sem
 * grupo conta pela empresa dele (todos os pessoais juntos somam um, todos os freelas sem grupo somam um).
 * Projeto sem empresa não conta.
 */
export function countClients(projects: CountedProject[]): number {
  return new Set(projects.flatMap((p) => clientKey(p) ?? [])).size
}

type BreakdownProject = Pick<Project, 'id' | 'title' | 'title_en' | 'visible' | 'client_id' | 'company'>

export type ClientUnit = {
  key: string
  kind: 'group' | 'company'
  /** nome do grupo (interno) ou da empresa */
  label: string
  company: string
  projects: string[]
}

export type ClientBreakdown = {
  /** o número que aparece no site */
  total: number
  /** cada cliente contado e os projetos visíveis que o fazem contar */
  units: ClientUnit[]
  /** projetos que não entram na conta e o porquê */
  notCounted: { project: string; reason: string }[]
  /** o que provavelmente está mal configurado */
  warnings: string[]
}

const titleOf = (p: Pick<Project, 'title' | 'title_en' | 'id'>) => p.title ?? p.title_en ?? p.id
const companyName = (c: Pick<Company, 'name' | 'name_en'>) => c.name ?? c.name_en ?? 'sem nome'

/**
 * A mesma conta do site (countClients sobre os projetos visíveis), explicada: quem conta, por causa de quais
 * projetos, o que fica de fora e avisos de configuração. Usada no painel (aba Empresas) e no MCP.
 */
export function clientBreakdown(projects: BreakdownProject[], companies: Company[], clients: CompanyClient[]): ClientBreakdown {
  const units = new Map<string, ClientUnit>()
  const notCounted: ClientBreakdown['notCounted'] = []
  for (const p of projects) {
    if (!p.visible) {
      notCounted.push({ project: titleOf(p), reason: 'oculto no site' })
      continue
    }
    const key = clientKey(p)
    if (!key || !p.company) {
      notCounted.push({ project: titleOf(p), reason: 'sem empresa' })
      continue
    }
    const group = p.client_id ? clients.find((c) => c.id === p.client_id) : undefined
    const unit = units.get(key) ?? {
      key,
      kind: p.client_id ? 'group' : 'company',
      label: p.client_id ? (group?.name ?? 'grupo sem nome') : companyName(p.company),
      company: companyName(p.company),
      projects: [],
    }
    unit.projects.push(titleOf(p))
    units.set(key, unit)
  }

  const warnings: string[] = []
  for (const company of companies) {
    const groups = clients.filter((c) => c.company_id === company.id)
    if (groups.length === 0) continue
    const loose = projects.filter((p) => p.visible && p.company?.id === company.id && !p.client_id)
    if (loose.length > 0)
      warnings.push(
        `${companyName(company)} tem grupos, mas ${loose.length} projeto(s) sem grupo contam juntos como mais 1 cliente: ${loose.map(titleOf).join(', ')}`
      )
    for (const g of groups)
      if (!units.has(`client:${g.id}`)) warnings.push(`Grupo "${g.name}" (${companyName(company)}) não tem projeto visível: não conta`)
  }

  return { total: units.size, units: [...units.values()], notCounted, warnings }
}
