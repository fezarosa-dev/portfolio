import { getAllArticles } from '@/lib/supabase/admin-queries'
import { ArticlesAdminList } from '@/components/admin/articles-admin-list'

export default async function AdminArtigosPage() {
  const articles = await getAllArticles()

  return <ArticlesAdminList articles={articles} />
}
