'use server'

import { revalidatePath } from 'next/cache'
import { upsertSiteContent, deleteSiteContentKey } from '@/lib/supabase/admin-queries'
import { parseBilingualPt, parseBilingualEn } from '@/lib/bilingual'

const KEYS = [
  'site_icon',
  'sobre_foto',
  'contato_email',
  'contato_telefone',
  'drive_folder_url',
  'status_color',
  'link_github',
  'link_linkedin',
] as const

const BILINGUAL_KEYS = ['hero_title', 'hero_subtitle', 'sobre_texto', 'servicos_texto', 'status_text'] as const

async function saveSide(key: string, value: string | null) {
  if (value === null) await deleteSiteContentKey(key)
  else await upsertSiteContent(key, value)
}

export async function toggleMascoteAtivo(ativo: boolean) {
  await upsertSiteContent('mascote_ativo', ativo ? 'true' : 'false')
  revalidatePath('/admin/personalizacao')
}

export async function saveSiteContent(formData: FormData) {
  await Promise.all([
    ...KEYS.map((key) => upsertSiteContent(key, String(formData.get(key) ?? ''))),
    ...BILINGUAL_KEYS.flatMap((key) => [
      saveSide(key, parseBilingualPt(formData, key)),
      saveSide(`${key}_en`, parseBilingualEn(formData, key)),
    ]),
  ])
  revalidatePath('/admin/personalizacao')
}
