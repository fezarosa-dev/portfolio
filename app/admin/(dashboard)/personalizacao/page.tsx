import { getSiteContent } from '@/lib/supabase/queries'
import { SiteContentForm } from '@/components/admin/site-content-form'
import { saveSiteContent, toggleMascoteAtivo } from './actions'

export default async function PersonalizacaoPage() {
  const content = await getSiteContent()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Personalização</h1>
      <SiteContentForm
        content={content}
        action={saveSiteContent}
        mascoteAtivo={content.mascote_ativo === 'true'}
        toggleMascoteAtivo={toggleMascoteAtivo}
      />
    </div>
  )
}
