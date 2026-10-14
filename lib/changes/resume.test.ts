import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enqueue, makeChange } from './queue.ts'
import { overlayResume, overlayResumeProjects, touchedIds } from './overlay.ts'
import type { ResumeSource } from '../resume.ts'
import type { Project } from '../supabase/queries.ts'
import type { Change, ChangeOp } from './types.ts'

let n = 0
const stackOf = (...ops: ChangeOp[]): Change[] =>
  ops.reduce<Change[]>((s, op) => enqueue(s, makeChange(op, 'x', `c${++n}`, n)), [])

const source = {
  profile: { full_name: 'Fulano', headline: 'Dev', headline_en: null, location: null, location_en: null, summary: null, summary_en: null },
  contact: { email: '', phone: '', links: [] },
  experiences: [
    { id: 'e1', role: 'A', position: 0 },
    { id: 'e2', role: 'B', position: 1 },
  ],
  companies: [],
  projects: [],
  education: [],
  spoken: [],
  categories: [{ id: 'k1', name: 'Langs', name_en: null, position: 0 }],
  skills: [
    { id: 's1', category_id: 'k1', language_id: null, label: 'X', label_en: null, position: 0 },
    { id: 's2', category_id: 'k1', language_id: null, label: 'Y', label_en: null, position: 1 },
  ],
  technologies: {},
  certifications: [],
} as unknown as ResumeSource

test('overlayResume: perfil, criar, editar, apagar e ordenar listas', () => {
  const out = overlayResume(
    source,
    stackOf(
      { type: 'resume.profile', values: { headline: 'Eng' } },
      { type: 'resume.add', entity: 'experiences', id: 'e3', data: { role: 'C' } },
      { type: 'resume.update', entity: 'experiences', id: 'e1', data: { role: 'A2' } },
      { type: 'resume.remove', entity: 'experiences', id: 'e2' },
      { type: 'resume.order', entity: 'experiences', ids: ['e3', 'e1'] }
    )
  )
  assert.equal(out.profile?.headline, 'Eng')
  assert.equal(out.profile?.full_name, 'Fulano')
  assert.deepEqual(out.experiences.map((e) => [e.id, e.role]), [['e3', 'C'], ['e1', 'A2']])
})

test('overlayResume: ordem de habilidades só dentro da categoria', () => {
  const out = overlayResume(source, stackOf({ type: 'resume.order', entity: 'skills', scopeId: 'k1', ids: ['s2', 's1'] }))
  assert.deepEqual(out.skills.map((s) => s.id), ['s2', 's1'])
})

test('editar item do currículo ainda não criado vira parte da criação; ordens de listas diferentes não se misturam', () => {
  const merged = stackOf(
    { type: 'resume.add', entity: 'education', id: 'd1', data: { degree: 'X' } },
    { type: 'resume.update', entity: 'education', id: 'd1', data: { degree: 'Y' } }
  )
  assert.equal(merged.length, 1)
  assert.equal((merged[0].op as Extract<ChangeOp, { type: 'resume.add' }>).data.degree, 'Y')
  const orders = stackOf(
    { type: 'resume.order', entity: 'experiences', ids: ['e1'] },
    { type: 'resume.order', entity: 'education', ids: ['d1'] },
    { type: 'resume.order', entity: 'experiences', ids: ['e2', 'e1'] }
  )
  assert.equal(orders.length, 2)
})

test('overlayResumeProjects: incluir vai pro fim; reordenar; touchedIds ignora ordem', () => {
  const p = (id: string, in_resume: boolean, resume_position: number) => ({ id, in_resume, resume_position }) as Project
  const base = [p('a', true, 0), p('b', true, 1), p('c', false, 0)]
  const out = overlayResumeProjects(base, stackOf({ type: 'resume.project', id: 'c', inResume: true }, { type: 'resume.projectOrder', ids: ['c', 'a', 'b'] }))
  assert.deepEqual(out.filter((x) => x.in_resume).sort((x, y) => x.resume_position - y.resume_position).map((x) => x.id), ['c', 'a', 'b'])
  const touched = touchedIds(stackOf({ type: 'resume.profile', values: {} }, { type: 'resume.project', id: 'c', inResume: true }, { type: 'resume.projectOrder', ids: ['c'] }), 'resume')
  assert.deepEqual([...touched], ['c'])
})
