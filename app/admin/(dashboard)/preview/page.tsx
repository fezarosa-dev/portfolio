import { draftMode } from 'next/headers'
import { Button } from '@/components/ui/button'
import { PreviewFrame } from './preview-frame'
import { enablePreview, disablePreview } from './actions'

export default async function PreviewPage() {
  const { isEnabled } = await draftMode()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Preview do site</h1>
        {isEnabled && (
          <form action={disablePreview}>
            <Button type="submit" variant="outline" size="sm">
              Sair do preview
            </Button>
          </form>
        )}
      </div>

      {isEnabled ? (
        <>
          <p className="rounded-md border border-hairline bg-card px-4 py-2 font-mono text-xs text-steel">
            ● Preview ativo — você vê as mudanças salvas na hora. Visitantes veem
            a versão de até 60s atrás até você usar “Republicar agora”.
          </p>
          <PreviewFrame />
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground/80">
            O preview mostra o site com os dados salvos agora, sem esperar o
            cache de 60s. Só você enxerga — os visitantes seguem na versão em
            cache.
          </p>
          <form action={enablePreview}>
            <Button type="submit">Ativar preview</Button>
          </form>
        </div>
      )}
    </div>
  )
}
