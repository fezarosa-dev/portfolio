'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QueueForm } from '@/components/admin/queue-form'
import { useChanges } from '@/components/admin/changes-provider'
import { ENTITIES, parseEntityForm, type ConfigEntity, type Field } from '@/app/admin/(dashboard)/curriculo/config'
import type { ResumeEntity } from '@/lib/changes/types'

type Row = Record<string, unknown> & { id: string }
type Company = { id: string; name: string | null }

const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm'
const val = (row: Row | undefined, name: string) => (row?.[name] == null ? '' : String(row[name]))

function FieldInput({ field, row, companies }: { field: Field; row?: Row; companies: Company[] }) {
  const id = `${row?.id ?? 'new'}-${field.name}`
  if (field.kind === 'company') {
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <select id={id} name={field.name} defaultValue={val(row, field.name)} className={selectClass}>
          <option value="">—</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    )
  }
  const Control = field.kind === 'textarea' ? Textarea : Input
  const common = { rows: field.kind === 'textarea' ? 4 : undefined, placeholder: field.placeholder }
  return (
    <div className={field.kind === 'textarea' ? 'sm:col-span-2' : undefined}>
      <Label htmlFor={id}>{field.label}</Label>
      <Control
        id={id}
        name={field.name}
        type={field.kind === 'int' ? 'number' : undefined}
        required={field.required}
        defaultValue={val(row, field.name)}
        {...common}
      />
      {field.bilingual && (
        <Control
          name={`${field.name}_en`}
          aria-label={`${field.label} (EN)`}
          placeholder="EN (opcional — vazio usa o PT)"
          defaultValue={val(row, `${field.name}_en`)}
          className="mt-1.5"
          rows={common.rows}
        />
      )}
    </div>
  )
}

/** Formulário de um item da lista (criar sem `row`, editar com `row`); enfileira em vez de gravar. */
export function ItemForm({
  entity,
  row,
  companies,
}: {
  entity: ConfigEntity
  row?: Row
  companies: Company[]
}) {
  const { enqueue } = useChanges()
  const config = ENTITIES[entity]

  function handleSubmit(formData: FormData) {
    const data = parseEntityForm(config.fields, formData) as Record<string, string | number | null>
    const what = config.summary(data) || config.title
    if (row) enqueue({ type: 'resume.update', entity, id: row.id, data }, `Currículo › ${config.title}: editar “${what}”`)
    else enqueue({ type: 'resume.add', entity, id: crypto.randomUUID(), data }, `Currículo › ${config.title}: novo “${what}”`)
  }

  return (
    <QueueForm
      onSubmit={handleSubmit}
      resetOnSubmit={!row}
      className="grid gap-3 sm:grid-cols-2"
      message={row ? 'Edição na lista de mudanças' : 'Item na lista de mudanças'}
    >
      {config.fields.map((field) => (
        <FieldInput key={field.name} field={field} row={row} companies={companies} />
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          {row ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </QueueForm>
  )
}

/** ↑ ↓ ✕ de um item; `siblings` são os ids da lista (ou da categoria) na ordem atual. */
export function RowControls({
  entity,
  id,
  siblings,
  scopeId,
  what,
}: {
  entity: ResumeEntity
  id: string
  siblings: string[]
  scopeId?: string
  what: string
}) {
  const { enqueue } = useChanges()
  const index = siblings.indexOf(id)

  function move(direction: -1 | 1) {
    const to = index + direction
    if (index < 0 || to < 0 || to >= siblings.length) return
    const ids = [...siblings]
    ;[ids[index], ids[to]] = [ids[to], ids[index]]
    enqueue({ type: 'resume.order', entity, scopeId, ids }, `Currículo: nova ordem (${what})`)
  }

  return (
    <div className="flex gap-1">
      <Button type="button" variant="outline" size="sm" aria-label="Subir" disabled={index <= 0} onClick={() => move(-1)}>
        ↑
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Descer"
        disabled={index < 0 || index >= siblings.length - 1}
        onClick={() => move(1)}
      >
        ↓
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Excluir"
        onClick={() => enqueue({ type: 'resume.remove', entity, id }, `Currículo: excluir “${what}”`)}
      >
        ✕
      </Button>
    </div>
  )
}

export function ResumeSection({
  entity,
  rows,
  companies = [],
  touched,
}: {
  entity: Exclude<ConfigEntity, 'skill_categories'>
  rows: Row[]
  companies?: Company[]
  touched: Set<string>
}) {
  const config = ENTITIES[entity]
  const ids = rows.map((row) => row.id)
  return (
    <section className="mt-10" id={entity}>
      <h2 className="text-lg font-semibold">{config.title}</h2>
      {config.hint && <p className="mt-1 font-mono text-xs text-steel">{config.hint}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`rounded-lg border p-3 ${touched.has(row.id) ? 'border-orange-500' : 'border-hairline'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer truncate text-sm">{config.summary(row)}</summary>
                <div className="mt-3">
                  <ItemForm key={JSON.stringify(row)} entity={entity} row={row} companies={companies} />
                </div>
              </details>
              <RowControls entity={entity} id={row.id} siblings={ids} what={config.summary(row)} />
            </div>
          </li>
        ))}
      </ul>

      <details className="mt-3 rounded-lg border border-dashed border-hairline p-3">
        <summary className="cursor-pointer font-mono text-xs text-signal">+ adicionar</summary>
        <div className="mt-3">
          <ItemForm entity={entity} companies={companies} />
        </div>
      </details>
    </section>
  )
}
