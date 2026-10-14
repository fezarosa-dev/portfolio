import { parseBilingualEn, parseBilingualPt } from '../bilingual.ts'
import type { ChangeOp } from './types.ts'

export type SiteChange = { op: ChangeOp; label: string }

/**
 * Compara o formulário enviado com o estado em que ele abriu (`initial`) e devolve só o que o usuário
 * mexeu: `plainKeys` são campos simples, `bilingualKeys` têm lado PT (`chave`) e EN (`chave_en`) com a
 * semântica de "em branco de propósito" (ver lib/bilingual.ts). `current` é o conteúdo já gravado
 * (usado só pra saber se há o que apagar quando um lado volta ao padrão).
 */
export function siteChangesFromForm(
  formData: FormData,
  initial: FormData,
  current: Record<string, string>,
  plainKeys: readonly string[],
  bilingualKeys: readonly string[]
): SiteChange[] {
  const changes: SiteChange[] = []
  const set = (key: string, value: string) =>
    changes.push({ op: { type: 'site.set', key, value }, label: `Personalização: ${key}` })

  for (const key of plainKeys) {
    const value = String(formData.get(key) ?? '')
    if (value !== String(initial.get(key) ?? '')) set(key, value)
  }
  const nav = formData.getAll('nav_hidden_links').join(',')
  if (nav !== initial.getAll('nav_hidden_links').join(',')) set('nav_hidden_links', nav)

  for (const key of bilingualKeys) {
    const sides = [
      [key, parseBilingualPt(formData, key), parseBilingualPt(initial, key)],
      [`${key}_en`, parseBilingualEn(formData, key), parseBilingualEn(initial, key)],
    ] as const
    for (const [side, value, before] of sides) {
      if (value === before) continue
      if (value === null) {
        if (side in current) changes.push({ op: { type: 'site.delete', key: side }, label: `Personalização: ${side} (padrão)` })
      } else {
        set(side, value)
      }
    }
  }
  return changes
}
