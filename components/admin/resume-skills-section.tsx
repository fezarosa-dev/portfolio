'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { QueueForm } from '@/components/admin/queue-form'
import { ItemForm, RowControls } from '@/components/admin/resume-section'
import { useChanges } from '@/components/admin/changes-provider'
import { importCategories } from '@/app/admin/(dashboard)/curriculo/actions'
import type { ResumeSkillCategoryRow, ResumeSkillRow } from '@/lib/resume'

export function ResumeSkillsSection({
  categories,
  skills,
  technologies,
  touched,
}: {
  categories: ResumeSkillCategoryRow[]
  skills: ResumeSkillRow[]
  technologies: { id: string; name: string }[]
  touched: Set<string>
}) {
  const { enqueue } = useChanges()
  const techName = new Map(technologies.map((t) => [t.id, t.name]))
  const sorted = [...categories].sort((a, b) => a.position - b.position)
  const categoryIds = sorted.map((c) => c.id)

  function addSkill(categoryId: string, formData: FormData) {
    const languageId = String(formData.get('language_id') ?? '') || null
    const label = String(formData.get('label') ?? '').trim() || null
    if (!languageId && !label) return
    enqueue(
      {
        type: 'resume.add',
        entity: 'skills',
        id: crypto.randomUUID(),
        data: {
          category_id: categoryId,
          language_id: languageId,
          label: languageId ? null : label,
          label_en: languageId ? null : String(formData.get('label_en') ?? '').trim() || null,
        },
      },
      `Currículo › Habilidades: nova “${languageId ? (techName.get(languageId) ?? 'tecnologia') : label}”`
    )
  }

  function editSkill(skill: ResumeSkillRow, formData: FormData) {
    const label = String(formData.get('label') ?? '').trim() || null
    if (!label) return
    enqueue(
      {
        type: 'resume.update',
        entity: 'skills',
        id: skill.id,
        data: { category_id: skill.category_id, language_id: null, label, label_en: String(formData.get('label_en') ?? '').trim() || null },
      },
      `Currículo › Habilidades: editar “${label}”`
    )
  }

  return (
    <section className="mt-10" id="skills">
      <h2 className="text-lg font-semibold">Habilidades técnicas</h2>
      <p className="mt-1 font-mono text-xs text-steel">
        cada habilidade é uma tecnologia já cadastrada ou um texto livre. categorias são suas — crie quantas quiser.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {sorted.map((category) => {
          const items = skills.filter((s) => s.category_id === category.id).sort((a, b) => a.position - b.position)
          const itemIds = items.map((s) => s.id)
          return (
            <div
              key={category.id}
              className={`rounded-lg border p-3 ${touched.has(category.id) ? 'border-orange-500' : 'border-hairline'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <details className="min-w-0 flex-1">
                  <summary className="cursor-pointer text-sm font-medium">{category.name}</summary>
                  <div className="mt-3">
                    <ItemForm
                      key={`${category.name}|${category.name_en}`}
                      entity="skill_categories"
                      row={category as unknown as { id: string }}
                      companies={[]}
                    />
                  </div>
                </details>
                <RowControls
                  entity="skill_categories"
                  id={category.id}
                  siblings={categoryIds}
                  what={category.name ?? 'categoria'}
                />
              </div>

              <ul className="mt-3 flex flex-col gap-1.5">
                {items.map((skill) => (
                  <li
                    key={skill.id}
                    className={`rounded-md bg-card px-2.5 py-1.5 text-sm ${touched.has(skill.id) ? 'outline outline-1 -outline-offset-1 outline-orange-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {skill.language_id ? techName.get(skill.language_id) : skill.label}
                        {skill.language_id ? (
                          <span className="ml-2 font-mono text-xs text-steel">tecnologia — nome PT/EN em Tecnologias</span>
                        ) : (
                          skill.label_en && <span className="ml-2 font-mono text-xs text-steel">EN: {skill.label_en}</span>
                        )}
                      </span>
                      <RowControls
                        entity="skills"
                        id={skill.id}
                        siblings={itemIds}
                        scopeId={category.id}
                        what={(skill.language_id ? techName.get(skill.language_id) : skill.label) ?? 'habilidade'}
                      />
                    </div>
                    {!skill.language_id && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer font-mono text-xs text-signal">editar</summary>
                        <QueueForm
                          key={`${skill.label}|${skill.label_en}`}
                          onSubmit={(fd) => editSkill(skill, fd)}
                          className="mt-2 flex flex-wrap items-end gap-2"
                        >
                          <Input name="label" defaultValue={skill.label ?? ''} aria-label="Habilidade (PT)" placeholder="PT" className="w-44" />
                          <Input name="label_en" defaultValue={skill.label_en ?? ''} aria-label="Habilidade (EN)" placeholder="EN (opcional)" className="w-44" />
                          <Button type="submit" size="sm">
                            Salvar
                          </Button>
                        </QueueForm>
                      </details>
                    )}
                  </li>
                ))}
              </ul>

              <QueueForm
                onSubmit={(fd) => addSkill(category.id, fd)}
                resetOnSubmit
                className="mt-3 flex flex-wrap items-end gap-2"
              >
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
              </QueueForm>
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
