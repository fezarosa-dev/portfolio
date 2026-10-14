import { getAllProjects } from '@/lib/supabase/admin-queries'
import { getLanguages, getAuthors, getCompanies } from '@/lib/supabase/queries'
import { ProjectEditor } from '@/components/admin/project-editor'

export default async function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [projects, availableLanguages, availableAuthors, availableCompanies] = await Promise.all([
    getAllProjects(),
    getLanguages(),
    getAuthors(),
    getCompanies(),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Editar projeto</h1>
      <ProjectEditor
        id={id}
        projects={projects}
        availableLanguages={availableLanguages}
        availableAuthors={availableAuthors}
        availableCompanies={availableCompanies}
      />
    </div>
  )
}
