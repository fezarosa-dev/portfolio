import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { ENTITIES, type ConfigEntity, type Field } from '@/app/admin/(dashboard)/autocurriculo/config'
import { saveItem, removeItem, moveItem } from '@/app/admin/(dashboard)/autocurriculo/actions'

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

export function ItemForm({
  entity,
  row,
  companies,
}: {
  entity: ConfigEntity
  row?: Row
  companies: Company[]
}) {
  return (
    <ToastForm action={saveItem.bind(null, entity)} successMessage={row ? 'Salvo' : 'Adicionado'} className="grid gap-3 sm:grid-cols-2">
      {row && <input type="hidden" name="id" value={row.id} />}
      {ENTITIES[entity].fields.map((field) => (
        <FieldInput key={field.name} field={field} row={row} companies={companies} />
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          {row ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </ToastForm>
  )
}

export function RowControls({ entity, id, categoryId }: { entity: string; id: string; categoryId?: string }) {
  return (
    <div className="flex gap-1">
      <form action={moveItem.bind(null, entity, id, -1, categoryId)}>
        <Button type="submit" variant="outline" size="sm" aria-label="Subir">
          ↑
        </Button>
      </form>
      <form action={moveItem.bind(null, entity, id, 1, categoryId)}>
        <Button type="submit" variant="outline" size="sm" aria-label="Descer">
          ↓
        </Button>
      </form>
      <form action={removeItem.bind(null, entity, id)}>
        <Button type="submit" variant="outline" size="sm" aria-label="Excluir">
          ✕
        </Button>
      </form>
    </div>
  )
}

export function ResumeSection({
  entity,
  rows,
  companies = [],
}: {
  entity: Exclude<ConfigEntity, 'skill_categories'>
  rows: Row[]
  companies?: Company[]
}) {
  const config = ENTITIES[entity]
  return (
    <section className="mt-10" id={entity}>
      <h2 className="text-lg font-semibold">{config.title}</h2>
      {config.hint && <p className="mt-1 font-mono text-xs text-steel">{config.hint}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-hairline p-3">
            <div className="flex items-center justify-between gap-3">
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer truncate text-sm">{config.summary(row)}</summary>
                <div className="mt-3">
                  <ItemForm entity={entity} row={row} companies={companies} />
                </div>
              </details>
              <RowControls entity={entity} id={row.id} />
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
