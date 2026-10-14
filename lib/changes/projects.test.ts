import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enqueue, makeChange } from './queue.ts'
import { overlayArticles, overlayProjects, touchedIds } from './overlay.ts'
import { articleDataFromForm, projectDataFromForm } from './forms.ts'
import type { ArticleData, Change, ChangeOp, ProjectData } from './types.ts'
import type { Article, Project } from '../supabase/queries.ts'

let n = 0
const stackOf = (...ops: ChangeOp[]): Change[] =>
  ops.reduce<Change[]>((s, op) => enqueue(s, makeChange(op, 'x', `c${++n}`, n)), [])

const data = (over: Partial<ProjectData> = {}): ProjectData => ({
  title: 'T', title_en: null, summary: null, summary_en: null, content_md: null, content_md_en: null,
  repo_url: null, site_url: null, click_mode: 'detail', click_url: null, company_id: null, position: 0,
  visible: true, show_on_home: false, in_resume: false, resume_what: null, resume_what_en: null,
  resume_with: null, resume_with_en: null, resume_solves: null, resume_solves_en: null,
  language_ids: [], author_ids: [], ...over,
})
const article = (over: Partial<ArticleData> = {}): ArticleData => ({
  title: 'A', title_en: null, summary: null, summary_en: null, content_md: null, content_md_en: null,
  position: 0, visible: true, ...over,
})
const ctx = {
  languages: [{ id: 'l1', name: 'Go', name_en: null, devicon_slug: null, devicon_variant: null, icon_source: null, position: 0, show_on_home: true, category_id: null }],
  authors: [{ id: 'a1', name: 'Ana', url: null }],
  companies: [{ id: 'c1', name: 'Acme', name_en: null, url: null }],
}
const project = (id: string, position: number): Project => ({
  ...data({ position }), id, slug: id, created_at: '2026-01-01', resume_position: 0, languages: [], authors: [], company: null,
})

test('editar um projeto ainda não criado vira parte da própria criação (continua 1 entrada)', () => {
  const stack = stackOf(
    { type: 'project.add', id: 'p1', data: data({ title: 'Novo' }) },
    { type: 'project.update', id: 'p1', data: data({ title: 'Novo 2' }) },
    { type: 'project.visible', id: 'p1', visible: false }
  )
  assert.equal(stack.length, 1)
  assert.equal(stack[0].op.type, 'project.add')
  const op = stack[0].op as Extract<ChangeOp, { type: 'project.add' }>
  assert.equal(op.data.title, 'Novo 2')
  assert.equal(op.data.visible, false)
})

test('apagar um projeto existente descarta toda mudança pendente dele (visibilidade inclusive)', () => {
  const stack = stackOf(
    { type: 'project.visible', id: 'p1', visible: false },
    { type: 'project.update', id: 'p2', data: data() },
    { type: 'project.remove', id: 'p1' }
  )
  assert.deepEqual(stack.map((c) => c.op.type), ['project.remove', 'project.update'])
})

test('criar e apagar um artigo antes de enviar cancela tudo', () => {
  assert.deepEqual(stackOf({ type: 'article.add', id: 'x', data: article() }, { type: 'article.remove', id: 'x' }), [])
})

test('overlayProjects: criar resolve tecnologias/autores/empresa, editar, ocultar, apagar e ordenar por position', () => {
  const base = [project('p1', 5), project('p2', 1)]
  const out = overlayProjects(
    base,
    stackOf(
      { type: 'project.add', id: 'p3', data: data({ title: 'Novo', position: 9, language_ids: ['l1'], author_ids: ['a1'], company_id: 'c1' }) },
      { type: 'project.update', id: 'p2', data: data({ title: 'Editado', position: 1 }) },
      { type: 'project.visible', id: 'p1', visible: false }
    ),
    ctx
  )
  assert.deepEqual(out.map((p) => p.id), ['p3', 'p1', 'p2'])
  assert.equal(out[0].languages[0].name, 'Go')
  assert.equal(out[0].authors[0].name, 'Ana')
  assert.equal(out[0].company?.name, 'Acme')
  assert.equal(out[1].visible, false)
  assert.equal(out[2].title, 'Editado')
  assert.equal(out[2].slug, 'p2')
  assert.deepEqual(overlayProjects(base, stackOf({ type: 'project.remove', id: 'p1' }), ctx).map((p) => p.id), ['p2'])
})

test('overlayArticles e touchedIds', () => {
  const base: Article[] = [{ ...article({ position: 1 }), id: 'a', created_at: '2026-01-01' }]
  const stack = stackOf(
    { type: 'article.add', id: 'b', data: article({ title: 'B', position: 3 }) },
    { type: 'article.visible', id: 'a', visible: false }
  )
  const out = overlayArticles(base, stack)
  assert.deepEqual(out.map((x) => x.id), ['b', 'a'])
  assert.equal(out[1].visible, false)
  assert.deepEqual([...touchedIds(stack, 'article')].sort(), ['a', 'b'])
})

test('projectDataFromForm / articleDataFromForm leem o FormData do admin', () => {
  const fd = new FormData()
  fd.set('title', 'Meu'); fd.set('title_en', ''); fd.set('click_mode', 'link'); fd.set('click_url', 'https://x')
  fd.set('position', '7'); fd.set('visible', 'true'); fd.set('show_on_home', 'false'); fd.set('in_resume', 'true')
  fd.append('language_ids', 'l1'); fd.append('language_ids', 'l2'); fd.append('author_ids', 'a1')
  const d = projectDataFromForm(fd)
  assert.equal(d.title, 'Meu')
  assert.equal(d.title_en, null)
  assert.equal(d.click_mode, 'link')
  assert.equal(d.position, 7)
  assert.equal(d.visible, true)
  assert.equal(d.in_resume, true)
  assert.deepEqual(d.language_ids, ['l1', 'l2'])
  assert.equal(d.company_id, null)
  const a = articleDataFromForm(fd)
  assert.equal(a.title, 'Meu')
  assert.equal(a.position, 7)
})
