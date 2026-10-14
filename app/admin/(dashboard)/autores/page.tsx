import { getAuthors } from '@/lib/supabase/queries'
import { AuthorsAdmin } from '@/components/admin/authors-admin'

export default async function AutoresPage() {
  const authors = await getAuthors()

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Autores</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pessoas que colaboraram nos seus projetos — depois é só marcar quem participou de cada
        projeto na aba Projetos.
      </p>

      <AuthorsAdmin authors={authors} />
    </div>
  )
}
