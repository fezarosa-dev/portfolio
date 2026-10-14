import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { ItemForm, RowControls } from '@/components/admin/resume-section'
import { saveItem, importCategories } from '@/app/admin/(dashboard)/curriculo/actions'
import type { ResumeSkillCategoryRow, ResumeSkillRow } from '@/lib/resume'

export function ResumeSkillsSection({
  categories,
  skills,
  technologies,
}: {
  categories: ResumeSkillCategoryRow[]
  skills: ResumeSkillRow[]
  technologies: { id: string; name: string }[]
}) {
  const techName = new Map(technologies.map((t) => [t.id, t.name]))
  const sorted = [...categories].sort((a, b) => a.position - b.position)

  return (
    <section className="mt-10" id="skills">
      <h2 className="text-lg font-semibold">Habilidades técnicas</h2>
      <p className="mt-1 font-mono text-xs text-steel">
        cada habilidade é uma tecnologia já cadastrada ou um texto livre. categorias são suas — crie quantas quiser.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {sorted.map((category) => {
          const items = skills.filter((s) => s.category_id === category.id).sort((a, b) => a.position - b.position)
          return (
            <div key={category.id} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-3">
                <details className="min-w-0 flex-1">
                  <summary className="cursor-pointer text-sm font-medium">{category.name}</summary>
                  <div className="mt-3">
                    <ItemForm entity="skill_categories" row={category as unknown as { id: string }} companies={[]} />
                  </div>
                </details>
                <RowControls entity="skill_categories" id={category.id} />
              </div>

              <ul className="mt-3 flex flex-col gap-1.5">
                {items.map((skill) => (
                  <li key={skill.id} className="flex items-center justify-between gap-3 rounded-md bg-card px-2.5 py-1.5 text-sm">
                    <span className="truncate">
                      {skill.language_id ? techName.get(skill.language_id) : skill.label}
                      {skill.language_id && <span className="ml-2 font-mono text-xs text-steel">tecnologia</span>}
                    </span>
                    <RowControls entity="skills" id={skill.id} categoryId={category.id} />
                  </li>
                ))}
              </ul>

              <ToastForm
                action={saveItem.bind(null, 'skills')}
                successMessage="Habilidade adicionada"
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="category_id" value={category.id} />
                <div>
                  <Label htmlFor={`tech-${category.id}`}>Tecnologia</Label>
                  <select
                    id={`tech-${category.id}`}
                    name="language_id"
                    defaultValue=""
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">— ou texto livre →</option>
                    {technologies.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`label-${category.id}`}>Texto livre</Label>
                  <Input id={`label-${category.id}`} name="label" placeholder="ex.: Metodologias Ágeis" />
                </div>
                <Input name="label_en" aria-label="Texto livre (EN)" placeholder="EN (opcional)" className="w-44" />
                <Button type="submit" size="sm">
                  Adicionar
                </Button>
              </ToastForm>
            </div>
          )
        })}
      </div>

      <details className="mt-3 rounded-lg border border-dashed border-hairline p-3">
        <summary className="cursor-pointer font-mono text-xs text-signal">+ nova categoria</summary>
        <div className="mt-3">
          <ItemForm entity="skill_categories" companies={[]} />
        </div>
      </details>

      <ToastForm action={importCategories} successMessage="Categorias importadas" className="mt-3">
        <Button type="submit" variant="outline" size="sm">
          Importar categorias das tecnologias
        </Button>
      </ToastForm>
    </section>
  )
}
