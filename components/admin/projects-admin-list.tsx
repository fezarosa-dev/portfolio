'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayAuthors, overlayCompanies, overlayLanguages, overlayProjects, touchedIds } from '@/lib/changes/overlay'
import type { Author, Company, Language, Project } from '@/lib/supabase/queries'

export function ProjectsAdminList({
  projects,
  languages,
  authors,
  companies,
}: {
  projects: Project[]
  languages: Language[]
  authors: Author[]
  companies: Company[]
}) {
  const { changes, enqueue } = useChanges()
  const list = useMemo(
    () =>
      overlayProjects(projects, changes, {
        languages: overlayLanguages(languages, changes),
        authors: overlayAuthors(authors, changes),
        companies: overlayCompanies(companies, changes),
      }),
    [projects, changes, languages, authors, companies]
  )
  const touched = useMemo(() => touchedIds(changes, 'project'), [changes])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Projetos <span className="font-mono text-sm font-normal text-steel">({list.length})</span>
        </h1>
        <Button render={<Link href="/admin/projetos/novo" />}>Novo projeto</Button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-card font-mono text-xs text-steel">
              <tr>
                <th className="px-4 py-3 font-normal">Título</th>
                <th className="px-4 py-3 font-normal">Visível</th>
                <th className="px-4 py-3 font-normal">Ao clicar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((project) => {
                const title = project.title ?? project.title_en ?? 'sem título'
                return (
                  <tr
                    key={project.id}
                    className={`border-t border-hairline ${touched.has(project.id) ? 'outline outline-1 -outline-offset-1 outline-orange-500' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{project.title}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          enqueue(
                            { type: 'project.visible', id: project.id, visible: !project.visible },
                            `Projeto “${title}”: ${project.visible ? 'ocultar' : 'mostrar'}`
                          )
                        }
                        className={project.visible ? 'font-mono text-xs text-status' : 'font-mono text-xs text-steel'}
                      >
                        {project.visible ? '● visível' : '○ oculto'}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-steel">
                      {project.click_mode === 'link' ? 'link' : 'página'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <Link href={`/admin/projetos/${project.id}`} className="text-signal hover:underline">
                          editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => enqueue({ type: 'project.remove', id: project.id }, `Projeto “${title}”: excluir`)}
                          className="text-destructive hover:underline"
                        >
                          excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
