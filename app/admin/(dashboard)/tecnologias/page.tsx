import { getLanguageCategories, getLanguages } from '@/lib/supabase/queries'
import { CategoryList } from '@/components/admin/category-list'
import { CategoryAddForm } from '@/components/admin/category-add-form'
import { TechnologyReorderList } from '@/components/admin/technology-reorder-list'
import { TechnologyAddForm } from '@/components/admin/technology-add-form'

export default async function TecnologiasPage() {
  const [languages, categories] = await Promise.all([getLanguages(), getLanguageCategories()])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Tecnologias</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Digite o nome da linguagem, framework ou ferramenta (ex: Python, TypeScript, Docker) — o
        ícone é encontrado automaticamente pelo nome. Se não encontrar (ex: Cython), preencha a
        URL do ícone manualmente. Arraste pelos pontinhos pra reordenar. Cada mudança vai pra Lista de mudanças — envie de lá. O
        ⌂ liga/desliga se a tecnologia aparece na tela inicial — ela continua valendo nos
        projetos e nos filtros mesmo desligada ali.
      </p>

      <section className="mb-10 max-w-md">
        <h2 className="mb-1 text-lg font-semibold">Categorias</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Agrupam as tecnologias na página /tecnologias do site (ex: Linguagens, Frameworks, Infra).
          Escolha a categoria de cada tecnologia na lista abaixo. Apagar uma categoria deixa as
          tecnologias dela sem categoria. Use ↑ ↓ pra mudar a ordem das seções; as mudanças vão pra Lista de mudanças.
        </p>
        <CategoryList categories={categories} />
        <CategoryAddForm />
      </section>

      <h2 className="mb-2 text-lg font-semibold">Tecnologias</h2>
      <TechnologyAddForm />

      <TechnologyReorderList languages={languages} categories={categories} />
    </div>
  )
}
