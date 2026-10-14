import { getSiteContent } from '@/lib/supabase/queries'
import { PersonalizacaoAdmin } from '@/components/admin/personalizacao-admin'
import { SITE_KEYS, SITE_BILINGUAL_KEYS } from '@/lib/site-keys'

export default async function PersonalizacaoPage() {
  const content = await getSiteContent()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Personalização</h1>
      <PersonalizacaoAdmin content={content} plainKeys={[...SITE_KEYS]} bilingualKeys={[...SITE_BILINGUAL_KEYS]} />
    </div>
  )
}
