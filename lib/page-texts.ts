import { resolveText } from '@/lib/bilingual'
import { dictionaries, type Dictionary, type Locale } from '@/lib/i18n/dictionaries'

// Textos da hero, de Serviços e de Contato editáveis em /admin/personalizacao.
// Cada campo tem um texto padrão no dicionário (dict[page][field]); o valor salvo no
// site_content (chave + '_en') sobrescreve. Fonte única pro admin, pra action e pras páginas.
export const PAGE_TEXTS = [
  { key: 'hero_tagline', page: 'home', field: 'tagline', label: 'Frase de impacto (abaixo do subtítulo)' },
  { key: 'servicos_lead', page: 'servicos', field: 'lead', label: 'Frase de apresentação' },
  { key: 'servicos_hire_title', page: 'servicos', field: 'hireTitle', label: 'Destaque de vagas — título' },
  { key: 'servicos_hire_text', page: 'servicos', field: 'hireText', label: 'Destaque de vagas — texto', multiline: true },
  { key: 'servicos_hire_resume', page: 'servicos', field: 'hireResume', label: 'Botão de currículo' },
  { key: 'servicos_hire_contact', page: 'servicos', field: 'hireContact', label: 'Botão de contato' },
  { key: 'servicos_projects_title', page: 'servicos', field: 'projectsTitle', label: 'Título da seção de serviços' },
  { key: 'servicos_cta_title', page: 'servicos', field: 'ctaTitle', label: 'Chamada final — texto' },
  { key: 'servicos_cta_button', page: 'servicos', field: 'ctaButton', label: 'Chamada final — botão' },
  { key: 'contato_lead', page: 'contato', field: 'lead', label: 'Frase de apresentação', multiline: true },
  { key: 'contato_form_title', page: 'contato', field: 'formTitle', label: 'Título do formulário' },
] as const

export type PageTextKey = (typeof PAGE_TEXTS)[number]['key']

export function defaultPageText(item: (typeof PAGE_TEXTS)[number], locale: Locale): string {
  const page = dictionaries[locale][item.page] as Record<string, string>
  return page[item.field]
}

/** Texto do admin se preenchido, senão o padrão do dicionário. */
export function pageText(
  content: Record<string, string>,
  locale: Locale,
  key: PageTextKey
): string {
  const item = PAGE_TEXTS.find((t) => t.key === key)!
  return resolveText(content[key], content[`${key}_en`], locale).trim() || defaultPageText(item, locale)
}

export type { Dictionary }
