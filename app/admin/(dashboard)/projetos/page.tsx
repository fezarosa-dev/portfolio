import { getAllProjects } from '@/lib/supabase/admin-queries'
import { getLanguages, getAuthors, getCompanies } from '@/lib/supabase/queries'
import { ProjectsAdminList } from '@/components/admin/projects-admin-list'

export default async function AdminProjetosPage() {
  const [projects, languages, authors, companies] = await Promise.all([
    getAllProjects(),
    getLanguages(),
    getAuthors(),
    getCompanies(),
  ])

  return <ProjectsAdminList projects={projects} languages={languages} authors={authors} companies={companies} />
}
