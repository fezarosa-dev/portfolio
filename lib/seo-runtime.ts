// separado de lib/seo.ts (que precisa continuar importável pelo test runner nativo do
// Node sem os módulos server-only do Next/Supabase) porque getSiteContent() depende de
// next/headers e do client do Supabase.
import type { Locale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/supabase/queries-cached'
import { PAGE_SEO, resolveSeoOverride } from '@/lib/seo'

/** Título/descrição de uma página do PAGE_SEO, com override do site_content (painel admin) aplicado. */
export async function getPageSeo(
  pageKey: keyof typeof PAGE_SEO,
  locale: Locale
): Promise<{ title: string; description: string }> {
  const content = await getSiteContent()
  return resolveSeoOverride(content, pageKey, locale, PAGE_SEO[pageKey][locale])
}
