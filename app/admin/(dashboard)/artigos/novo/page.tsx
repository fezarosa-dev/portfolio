import { getAllArticles } from '@/lib/supabase/admin-queries'
import { ArticleEditor } from '@/components/admin/article-editor'

export default async function NovoArtigoPage() {
  const articles = await getAllArticles()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Novo artigo</h1>
      <ArticleEditor id={null} articles={articles} />
    </div>
  )
}
