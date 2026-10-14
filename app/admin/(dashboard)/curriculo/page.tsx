import { getResumeSource } from '@/lib/supabase/resume-queries'
import { getAllProjects } from '@/lib/supabase/admin-queries'
import { getAuthors, getCompanies, getLanguages } from '@/lib/supabase/queries'
import { ResumeAdmin } from '@/components/admin/resume-admin'

export default async function CurriculoPage() {
  const [source, projects, languages, authors, companies] = await Promise.all([
    getResumeSource(),
    getAllProjects(),
    getLanguages(),
    getAuthors(),
    getCompanies(),
  ])

  return <ResumeAdmin source={source} projects={projects} languages={languages} authors={authors} companies={companies} />
}
