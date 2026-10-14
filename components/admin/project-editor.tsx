'use client'

import { useMemo } from 'react'
import { useChanges } from '@/components/admin/changes-provider'
import { ProjectForm } from '@/components/admin/project-form'
import { overlayAuthors, overlayCompanies, overlayLanguages, overlayProjects } from '@/lib/changes/overlay'
import type { ProjectData } from '@/lib/changes/types'
import type { Author, Company, Language, Project } from '@/lib/supabase/queries'

/** Cria (id = null) ou edita um projeto pela fila; a edição enxerga o que já está na fila. */
export function ProjectEditor({
  id,
  projects,
  availableLanguages,
  availableAuthors,
  availableCompanies,
}: {
  id: string | null
  projects: Project[]
  availableLanguages: Language[]
  availableAuthors: Author[]
  availableCompanies: Company[]
}) {
  const { changes, enqueue, loaded } = useChanges()
  const ctx = useMemo(
    () => ({
      languages: overlayLanguages(availableLanguages, changes),
      authors: overlayAuthors(availableAuthors, changes),
      companies: overlayCompanies(availableCompanies, changes),
    }),
    [availableLanguages, availableAuthors, availableCompanies, changes]
  )
  const project = useMemo(() => (id ? overlayProjects(projects, changes, ctx).find((p) => p.id === id) ?? null : null), [id, projects, changes, ctx])
  // id gerado uma vez por formulário novo: a criação já nasce com o id que as edições seguintes vão usar
  const newId = useMemo(() => crypto.randomUUID(), [])

  if (!loaded) return null
  if (id && !project) return <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>

  function handleSubmit(data: ProjectData) {
    const target = id ?? newId
    const title = data.title ?? data.title_en ?? 'sem título'
    const pendingCreate = !id || changes.some((c) => c.op.type === 'project.add' && c.op.id === id)
    enqueue(
      { type: id ? 'project.update' : 'project.add', id: target, data },
      pendingCreate ? `Novo projeto “${title}”` : `Projeto “${title}”: editar`
    )
  }

  return (
    <ProjectForm
      key={project?.id ?? 'novo'}
      project={project}
      availableLanguages={availableLanguages}
      availableAuthors={availableAuthors}
      availableCompanies={availableCompanies}
      onSubmit={handleSubmit}
    />
  )
}
