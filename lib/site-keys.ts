import { PAGE_TEXTS } from '@/lib/page-texts'
import { SEO_PAGE_KEYS } from '@/lib/seo'

const SEO_PAGES = ['home', ...SEO_PAGE_KEYS]

export const SITE_KEYS = [
  'site_icon',
  'sobre_foto',
  'contato_email',
  'contato_telefone',
  'drive_folder_url',
  'status_color',
  'link_github',
  'link_linkedin',
  'search_rate_limit_max',
  'search_rate_limit_window_minutes',
  'search_max_query_length',
  'search_semantic_timeout_ms',
  'search_results_limit',
  'easter_eggs_ativo',
  'tecnologias_ativo',
  'mascote_ativo',
  'rickroll_video_filename',
  'rickroll_clicks',
  'projetos_linhas_tecnologias',
] as const

export const SITE_BILINGUAL_KEYS = [
  'hero_title',
  'hero_subtitle',
  'sobre_texto',
  'servicos_texto',
  'status_text',
  'como_usar_texto',
  'privacidade_texto',
  'termos_texto',
  'cookies_texto',
  ...PAGE_TEXTS.map((t) => t.key),
  ...SEO_PAGES.flatMap((page) => [`seo_${page}_title`, `seo_${page}_description`]),
  'seo_home_keywords',
]

/** Número positivo de uma chave de configuração; vazio, inválido ou <= 0 cai no padrão. */
export function numberFromContent(content: Record<string, string>, key: string, fallback: number): number {
  const parsed = Number(content[key])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const DEFAULT_PROJECT_TECH_ROWS = 3

/** Quantas linhas de tecnologias o card de projeto mostra antes do chip "+N" (inteiro, mínimo 1). */
export function projectTechRows(content: Record<string, string>): number {
  return Math.max(1, Math.floor(numberFromContent(content, 'projetos_linhas_tecnologias', DEFAULT_PROJECT_TECH_ROWS)))
}
