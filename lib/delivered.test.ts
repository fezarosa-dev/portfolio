import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectCompanies, topTechnologies } from './delivered.ts'
import type { Company, Language } from './supabase/queries.ts'

const lang = (id: string, position: number) => ({ id, position }) as Language
const company = (id: string) => ({ id, name: id, name_en: null, url: null }) as Company

test('tecnologias mais usadas primeiro, empate pela ordem do painel, até o limite', () => {
  const py = lang('py', 2)
  const ts = lang('ts', 1)
  const go = lang('go', 0)
  const projects = [{ languages: [py, ts] }, { languages: [py, go] }, { languages: [ts] }]
  assert.deepEqual(topTechnologies(projects, 2).map((l) => l.id), ['ts', 'py'])
  assert.deepEqual(topTechnologies(projects, 9).map((l) => l.id), ['ts', 'py', 'go'])
})

test('empresas sem repetir, a com mais projetos primeiro, ignorando projeto sem empresa', () => {
  const a = company('a')
  const b = company('b')
  const projects = [{ company: a }, { company: b }, { company: b }, { company: null }]
  assert.deepEqual(projectCompanies(projects).map((c) => c.id), ['b', 'a'])
})
