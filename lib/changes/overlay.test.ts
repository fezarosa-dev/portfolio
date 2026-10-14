import { test } from 'node:test'
import assert from 'node:assert/strict'
import { overlayCategories, overlayLanguages, touchedIds } from './overlay.ts'
import { enqueue, makeChange } from './queue.ts'
import { resolveIcon } from '../icons.ts'
import type { Change, ChangeOp } from './types.ts'
import type { Language, LanguageCategory } from '../supabase/queries.ts'

const lang = (id: string, name: string, position: number): Language => ({
  id,
  name,
  name_en: null,
  devicon_slug: 'python',
  devicon_variant: 'plain',
  icon_source: 'devicon',
  position,
  show_on_home: true,
  category_id: null,
})
const base = [lang('a', 'Python', 0), lang('b', 'Go', 1)]

let n = 0
const stackOf = (...ops: ChangeOp[]): Change[] =>
  ops.reduce<Change[]>((s, op) => enqueue(s, makeChange(op, 'x', `c${++n}`, n)), [])

test('overlayLanguages aplica edições campo a campo', () => {
  const out = overlayLanguages(
    base,
    stackOf(
      { type: 'language.update', id: 'a', field: 'nameEn', value: 'Pyth' },
      { type: 'language.update', id: 'a', field: 'showOnHome', value: false },
      { type: 'language.update', id: 'a', field: 'categoryId', value: 'cat1' }
    )
  )
  assert.equal(out[0].name_en, 'Pyth')
  assert.equal(out[0].show_on_home, false)
  assert.equal(out[0].category_id, 'cat1')
  assert.equal(out[1].name, 'Go')
})

test('renomear resolve o ícone pelo novo nome; ícone customizado vence', () => {
  const renamed = overlayLanguages(base, stackOf({ type: 'language.update', id: 'a', field: 'name', value: 'Rust' }))
  assert.equal(renamed[0].name, 'Rust')
  assert.equal(renamed[0].devicon_slug, resolveIcon('Rust')?.slug ?? null)

  const custom = overlayLanguages(base, stackOf({ type: 'language.update', id: 'a', field: 'iconUrl', value: 'https://x/y.svg' }))
  assert.equal(custom[0].icon_source, 'custom')
  assert.equal(custom[0].devicon_slug, 'https://x/y.svg')

  const stillCustom = overlayLanguages(
    custom,
    stackOf({ type: 'language.update', id: 'a', field: 'name', value: 'Rust' })
  )
  assert.equal(stillCustom[0].devicon_slug, 'https://x/y.svg')
})

test('overlayLanguages: criar aparece no fim, apagar some, ordenar reposiciona', () => {
  const out = overlayLanguages(
    base,
    stackOf(
      { type: 'language.add', id: 'c', name: 'Rust', nameEn: 'Rust EN', iconUrl: '' },
      { type: 'language.remove', id: 'b' },
      { type: 'language.order', ids: ['c', 'a'] }
    )
  )
  assert.deepEqual(out.map((l) => l.id), ['c', 'a'])
  assert.deepEqual(out.map((l) => l.position), [0, 1])
  assert.equal(out[0].name_en, 'Rust EN')
  assert.equal(out[0].show_on_home, true)
})

test('overlayCategories: editar, criar, apagar e ordenar', () => {
  const cats: LanguageCategory[] = [
    { id: 'k1', name: 'Langs', name_en: null, position: 0 },
    { id: 'k2', name: 'Infra', name_en: null, position: 1 },
  ]
  const out = overlayCategories(
    cats,
    stackOf(
      { type: 'category.update', id: 'k1', field: 'nameEn', value: 'Languages' },
      { type: 'category.add', id: 'k3', name: 'Dados', nameEn: '' },
      { type: 'category.remove', id: 'k2' },
      { type: 'category.order', ids: ['k3', 'k1'] }
    )
  )
  assert.deepEqual(out.map((c) => c.id), ['k3', 'k1'])
  assert.equal(out[1].name_en, 'Languages')
  assert.equal(out[0].name_en, null)
})

test('touchedIds lista só quem tem edição/criação pendente (ordenar e apagar não contam)', () => {
  const stack = stackOf(
    { type: 'language.update', id: 'a', field: 'name', value: 'X' },
    { type: 'language.add', id: 'c', name: 'N', nameEn: '', iconUrl: '' },
    { type: 'language.order', ids: ['a'] },
    { type: 'language.remove', id: 'b' },
    { type: 'category.update', id: 'k1', field: 'name', value: 'Y' }
  )
  assert.deepEqual([...touchedIds(stack, 'language')].sort(), ['a', 'c'])
  assert.deepEqual([...touchedIds(stack, 'category')], ['k1'])
})
