import type { Locale } from '@/lib/i18n/dictionaries'

/**
 * pt e en são totalmente simétricos: cada um pode ser
 *   null       -> não decidido, cai pro outro idioma se ele tiver texto
 *   '' (vazio) -> definido como "sem tradução" de propósito, não cai pro outro
 *   texto      -> usa esse texto
 */
export function resolveText(
  pt: string | null | undefined,
  en: string | null | undefined,
  locale: Locale
): string {
  const primary = locale === 'en' ? en : pt
  const fallback = locale === 'en' ? pt : en
  if (primary !== null && primary !== undefined) return primary
  return fallback ?? ''
}

/** Nome de tecnologia no idioma da página (EN vazio/ausente cai pro nome PT). */
export function langName(lang: { name: string; name_en?: string | null }, locale: Locale): string {
  return resolveText(lang.name, lang.name_en, locale)
}

function parseSide(formData: FormData, fieldName: string, blankName: string): string | null {
  const value = String(formData.get(fieldName) ?? '').trim()
  if (value) return value
  return formData.get(blankName) === 'true' ? '' : null
}

/** Lê o lado PT de um BilingualField (name/name_blank) de um FormData de admin. */
export function parseBilingualPt(formData: FormData, name: string): string | null {
  return parseSide(formData, name, `${name}_blank`)
}

/** Lê o lado EN de um BilingualField (name_en/name_en_blank) de um FormData de admin. */
export function parseBilingualEn(formData: FormData, name: string): string | null {
  return parseSide(formData, `${name}_en`, `${name}_en_blank`)
}
