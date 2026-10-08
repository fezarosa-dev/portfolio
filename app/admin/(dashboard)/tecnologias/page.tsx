import { getLanguageCategories, getLanguages } from '@/lib/supabase/queries'
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
  saveCategory,
  editCategory,
  removeCategory,
  moveCategory,
} from './actions'

export default async function TecnologiasPage() {
  const [languages, categories] = await Promise.all([getLanguages(), getLanguageCategories()])

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

      <section className="mb-10 max-w-md">
        <h2 className="mb-1 text-lg font-semibold">Categorias</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Agrupam as tecnologias na página /tecnologias do site (ex: Linguagens, Frameworks, Infra).
          Escolha a categoria de cada tecnologia na lista abaixo. Apagar uma categoria deixa as
          tecnologias dela sem categoria. Use ↑ ↓ pra mudar a ordem das seções.
        </p>
        <ul className="mb-3 flex flex-col gap-2">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
              <ToastForm action={moveCategory.bind(null, c.id, -1)} successMessage="Ordem atualizada">
                <button type="submit" disabled={i === 0} className="px-1 text-steel hover:text-signal disabled:opacity-30">
                  ↑
                </button>
              </ToastForm>
              <ToastForm action={moveCategory.bind(null, c.id, 1)} successMessage="Ordem atualizada">
                <button
                  type="submit"
                  disabled={i === categories.length - 1}
                  className="px-1 text-steel hover:text-signal disabled:opacity-30"
                >
                  ↓
                </button>
              </ToastForm>
              <ToastForm
                action={editCategory.bind(null, c.id)}
                successMessage="Categoria atualizada"
                className="flex flex-1 gap-2"
              >
                <Input name="name" defaultValue={c.name} className="h-8" required />
                <Input name="nameEn" defaultValue={c.name_en ?? ''} placeholder="Inglês" className="h-8" />
                <Button type="submit" variant="outline" size="sm">
                  Salvar
                </Button>
              </ToastForm>
              <ToastForm action={removeCategory.bind(null, c.id)} successMessage="Categoria removida">
                <button type="submit" className="px-1 text-muted-foreground hover:text-destructive">
                  ×
                </button>
              </ToastForm>
            </li>
          ))}
        </ul>
        <ToastForm action={saveCategory} successMessage="Categoria adicionada" className="flex gap-2">
          <Input name="name" placeholder="Nome (ex: Linguagens)" required />
          <Input name="nameEn" placeholder="Inglês (ex: Languages)" />
          <Button type="submit">Adicionar</Button>
        </ToastForm>
      </section>

      <h2 className="mb-2 text-lg font-semibold">Tecnologias</h2>
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
        categories={categories}
        editAction={editLanguage}
        removeAction={removeLanguage}
        saveOrderAction={saveLanguagesOrder}
        toggleShowOnHomeAction={toggleShowOnHome}
      />
    </div>
  )
}
