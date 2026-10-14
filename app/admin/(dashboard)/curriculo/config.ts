import { formatRange } from '@/lib/resume'

export type Field = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'int' | 'company'
  /** gera também `${name}_en` (opcional; vazio = cai pro PT) */
  bilingual?: boolean
  required?: boolean
  placeholder?: string
}

type Row = Record<string, unknown>
const s = (v: unknown) => (typeof v === 'string' ? v : '')
const n = (v: unknown) => (typeof v === 'number' ? v : null)

export const ENTITIES = {
  experiences: {
    title: 'Experiências profissionais',
    hint: 'fim em branco = emprego atual. tópicos: um por linha.',
    fields: [
      { name: 'company_id', label: 'Empresa', kind: 'company' },
      { name: 'role', label: 'Cargo', kind: 'text', bilingual: true, required: true },
      { name: 'start_month', label: 'Início — mês (1-12)', kind: 'int' },
      { name: 'start_year', label: 'Início — ano', kind: 'int', required: true },
      { name: 'end_month', label: 'Fim — mês (1-12)', kind: 'int' },
      { name: 'end_year', label: 'Fim — ano', kind: 'int' },
      { name: 'topics', label: 'Tópicos (um por linha)', kind: 'textarea', bilingual: true },
    ] satisfies Field[],
    summary: (r: Row) =>
      `${s(r.role)} — ${formatRange({ year: n(r.start_year), month: n(r.start_month) }, { year: n(r.end_year), month: n(r.end_month) }, 'pt', 'Atual')}`,
  },
  education: {
    title: 'Formação acadêmica',
    hint: 'ex.: Bacharelado em Ciência da Computação · UNIFEI · 2026 – Previsão 2029',
    fields: [
      { name: 'degree', label: 'Formação', kind: 'text', bilingual: true, required: true },
      { name: 'institution', label: 'Instituição', kind: 'text', bilingual: true },
      { name: 'year', label: 'Ano', kind: 'text', placeholder: '2023 a 2025' },
    ] satisfies Field[],
    summary: (r: Row) => `${s(r.degree)} — ${s(r.year)}`,
  },
  spoken: {
    title: 'Idiomas',
    hint: 'ex.: Inglês · Avançado',
    fields: [
      { name: 'language', label: 'Idioma', kind: 'text', bilingual: true, required: true },
      { name: 'level', label: 'Nível', kind: 'text', bilingual: true },
    ] satisfies Field[],
    summary: (r: Row) => `${s(r.language)} — ${s(r.level)}`,
  },
  certifications: {
    title: 'Treinamentos e certificações',
    hint: 'datas opcionais; pode usar só o ano. sem fim = mostra só o início.',
    fields: [
      { name: 'name', label: 'Nome', kind: 'text', bilingual: true, required: true },
      { name: 'start_month', label: 'Início — mês (1-12)', kind: 'int' },
      { name: 'start_year', label: 'Início — ano', kind: 'int' },
      { name: 'end_month', label: 'Fim — mês (1-12)', kind: 'int' },
      { name: 'end_year', label: 'Fim — ano', kind: 'int' },
    ] satisfies Field[],
    summary: (r: Row) =>
      `${s(r.name)} — ${formatRange({ year: n(r.start_year), month: n(r.start_month) }, { year: n(r.end_year), month: n(r.end_month) }, 'pt')}`,
  },
  skill_categories: {
    title: 'Categorias de habilidades',
    hint: '',
    fields: [{ name: 'name', label: 'Nome da categoria', kind: 'text', bilingual: true, required: true }] satisfies Field[],
    summary: (r: Row) => s(r.name),
  },
} as const

export type ConfigEntity = keyof typeof ENTITIES

/** Lê do FormData só os campos declarados na config (nada além disso chega no banco). */
export function parseEntityForm(fields: readonly Field[], formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const text = (name: string) => String(formData.get(name) ?? '').trim()
  for (const f of fields) {
    if (f.kind === 'int') out[f.name] = text(f.name) === '' ? null : Math.trunc(Number(text(f.name)))
    else if (f.kind === 'company') out[f.name] = text(f.name) || null
    else {
      out[f.name] = text(f.name) || null
      if (f.bilingual) out[`${f.name}_en`] = text(`${f.name}_en`) || null
    }
  }
  return out
}
