export type LanguageField = 'name' | 'nameEn' | 'categoryId' | 'iconUrl' | 'showOnHome'
export type CategoryField = 'name' | 'nameEn'

export type ChangeOp =
  | { type: 'language.add'; id: string; name: string; nameEn: string; iconUrl: string }
  | { type: 'language.update'; id: string; field: LanguageField; value: string | boolean | null }
  | { type: 'language.remove'; id: string }
  | { type: 'language.order'; ids: string[] }
  | { type: 'category.add'; id: string; name: string; nameEn: string }
  | { type: 'category.update'; id: string; field: CategoryField; value: string }
  | { type: 'category.remove'; id: string }
  | { type: 'category.order'; ids: string[] }

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
