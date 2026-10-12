import Link from 'next/link'
import { getAllProjects } from '@/lib/supabase/admin-queries'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { removeProject, toggleVisibility } from './actions'

export default async function AdminProjetosPage() {
  const projects = await getAllProjects()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Projetos <span className="font-mono text-sm font-normal text-steel">({projects.length})</span>
        </h1>
        <Button render={<Link href="/admin/projetos/novo" />}>Novo projeto</Button>
      </div>

      {projects.length === 0 ? (
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
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium">{project.title}</td>
                  <td className="px-4 py-3">
                    <form action={toggleVisibility.bind(null, project.id, !project.visible)}>
                      <button
                        type="submit"
                        className={
                          project.visible
                            ? 'font-mono text-xs text-status'
                            : 'font-mono text-xs text-steel'
                        }
                      >
                        {project.visible ? '● visível' : '○ oculto'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-steel">
                    {project.click_mode === 'link' ? 'link' : 'página'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/admin/projetos/${project.id}`}
                        className="text-signal hover:underline"
                      >
                        editar
                      </Link>
                      <ToastForm action={removeProject.bind(null, project.id)} successMessage="Projeto excluído">
                        <button type="submit" className="text-destructive hover:underline">
                          excluir
                        </button>
                      </ToastForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
