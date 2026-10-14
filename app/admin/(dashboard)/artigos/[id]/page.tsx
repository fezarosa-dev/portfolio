import { getAllArticles } from '@/lib/supabase/admin-queries'
import { ArticleEditor } from '@/components/admin/article-editor'

export default async function EditarArtigoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const articles = await getAllArticles()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Editar artigo</h1>
      <ArticleEditor id={id} articles={articles} />
    </div>
  )
}
