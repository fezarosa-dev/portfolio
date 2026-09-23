import { getSiteContent } from '@/lib/supabase/queries'
import { SiteContentForm } from '@/components/admin/site-content-form'
import { MascoteAtivoToggle } from '@/components/admin/mascote-ativo-toggle'
import { ReindexSearchButton } from '@/components/admin/reindex-search-button'
import { saveSiteContent, toggleMascoteAtivo, reindexAllSearchContent } from './actions'

export default async function PersonalizacaoPage() {
  const content = await getSiteContent()
  const mascoteAtivo = content.mascote_ativo === 'true'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Personalização</h1>

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-hairline bg-card p-4">
        <MascoteAtivoToggle ativo={mascoteAtivo} action={toggleMascoteAtivo} />
        <p className="font-mono text-xs text-steel">
          exibe o cachorro dormindo fixo no canto do site
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-lg border border-hairline bg-card p-4">
        <ReindexSearchButton action={reindexAllSearchContent} />
        <p className="font-mono text-xs text-steel">
          reprocessa a busca do site inteiro — rodar uma vez após publicar essa feature, ou se a busca parecer desatualizada
        </p>
      </div>

      <SiteContentForm content={content} action={saveSiteContent} />
    </div>
  )
}
