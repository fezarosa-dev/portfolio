import { getLanguages } from '@/lib/supabase/queries'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { TechnologyReorderList } from '@/components/admin/technology-reorder-list'
import {
  saveLanguage,
  removeLanguage,
  editLanguage,
  saveLanguagesOrder,
  toggleShowOnHome,
} from './actions'

export default async function TecnologiasPage() {
  const languages = await getLanguages()

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Tecnologias</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Digite o nome da linguagem, framework ou ferramenta (ex: Python, TypeScript, Docker) — o
        ícone é encontrado automaticamente pelo nome. Se não encontrar (ex: Cython), preencha a
        URL do ícone manualmente. Arraste pelos pontinhos pra reordenar como aparecem no site. O
        ⌂ liga/desliga se a tecnologia aparece na tela inicial — ela continua valendo nos
        projetos e nos filtros mesmo desligada ali.
      </p>

      <ToastForm
        action={saveLanguage}
        successMessage="Tecnologia adicionada"
        className="mb-8 flex max-w-sm flex-col gap-2"
        confirmReindex
      >
        <div className="flex gap-2">
          <Input name="name" placeholder="Nome (ex: Python)" required />
          <Button type="submit">Adicionar</Button>
        </div>
        <Input name="iconUrl" placeholder="URL do ícone (opcional, se não for encontrado)" />
      </ToastForm>

      <TechnologyReorderList
        languages={languages}
        editAction={editLanguage}
        removeAction={removeLanguage}
        saveOrderAction={saveLanguagesOrder}
        toggleShowOnHomeAction={toggleShowOnHome}
      />
    </div>
  )
}
