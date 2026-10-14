import { getLanguageCategories, getLanguages } from '@/lib/supabase/queries'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { CategoryList } from '@/components/admin/category-list'
import { TechnologyReorderList } from '@/components/admin/technology-reorder-list'
import {
  saveLanguage,
  removeLanguage,
  saveLanguagesBatch,
  saveCategory,
  saveCategoriesBatch,
  removeCategory,
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
          tecnologias dela sem categoria. Use ↑ ↓ pra mudar a ordem das seções e clique em Salvar pra gravar.
        </p>
        <CategoryList categories={categories} removeAction={removeCategory} saveAction={saveCategoriesBatch} />
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
      >
        <div className="flex gap-2">
          <Input name="name" placeholder="Nome PT (ex: Python)" required />
          <Input name="name_en" placeholder="Nome EN (opcional)" />
          <Button type="submit">Adicionar</Button>
        </div>
        <Input name="iconUrl" placeholder="URL do ícone (opcional, se não for encontrado)" />
      </ToastForm>

      <TechnologyReorderList
        languages={languages}
        categories={categories}
        removeAction={removeLanguage}
        saveAction={saveLanguagesBatch}
      />
    </div>
  )
}
