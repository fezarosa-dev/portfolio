export type LanguageField = 'name' | 'nameEn' | 'categoryId' | 'iconUrl' | 'showOnHome'
export type CategoryField = 'name' | 'nameEn'

export type ProjectData = {
  title: string | null
  title_en: string | null
  summary: string | null
  summary_en: string | null
  content_md: string | null
  content_md_en: string | null
  repo_url: string | null
  site_url: string | null
  click_mode: 'detail' | 'link'
  click_url: string | null
  company_id: string | null
  position: number
  visible: boolean
  show_on_home: boolean
  in_resume: boolean
  resume_what: string | null
  resume_what_en: string | null
  resume_with: string | null
  resume_with_en: string | null
  resume_solves: string | null
  resume_solves_en: string | null
  language_ids: string[]
  author_ids: string[]
}

export type ArticleData = {
  title: string | null
  title_en: string | null
  summary: string | null
  summary_en: string | null
  content_md: string | null
  content_md_en: string | null
  position: number
  visible: boolean
}

export type ChangeOp =
  | { type: 'language.add'; id: string; name: string; nameEn: string; iconUrl: string }
  | { type: 'language.update'; id: string; field: LanguageField; value: string | boolean | null }
  | { type: 'language.remove'; id: string }
  | { type: 'language.order'; ids: string[] }
  | { type: 'category.add'; id: string; name: string; nameEn: string }
  | { type: 'category.update'; id: string; field: CategoryField; value: string }
  | { type: 'category.remove'; id: string }
  | { type: 'category.order'; ids: string[] }
  | { type: 'project.add'; id: string; data: ProjectData }
  | { type: 'project.update'; id: string; data: ProjectData }
  | { type: 'project.visible'; id: string; visible: boolean }
  | { type: 'project.remove'; id: string }
  | { type: 'article.add'; id: string; data: ArticleData }
  | { type: 'article.update'; id: string; data: ArticleData }
  | { type: 'article.visible'; id: string; visible: boolean }
  | { type: 'article.remove'; id: string }

export type Change = {
  id: string
  /** chave de coalescência: editar o mesmo campo de novo substitui a entrada anterior */
  key: string
  ts: number
  label: string
  op: ChangeOp
  status: 'pending' | 'error'
  error?: string
}
