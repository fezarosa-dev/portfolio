import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanQuery, matchTechs, wantsProjects } from './intent.ts'

const techs = [{ name: 'Python' }, { name: 'C' }, { name: 'C#' }, { name: 'Node.js' }, { name: 'Power Automate' }]

test('cleanQuery tira palavras genéricas', () => {
  assert.equal(cleanQuery('Projetos com Python'), 'python')
  assert.equal(cleanQuery('projetos'), 'projetos')
})

test('wantsProjects', () => {
  assert.equal(wantsProjects('Projetos com python'), true)
  assert.equal(wantsProjects('python'), false)
})

test('matchTechs casa palavra inteira', () => {
  assert.deepEqual(matchTechs('Projetos com Python', techs).map((t) => t.name), ['Python'])
  assert.deepEqual(matchTechs('node.js e c#', techs).map((t) => t.name), ['C#', 'Node.js'])
  assert.deepEqual(matchTechs('power automate', techs).map((t) => t.name), ['Power Automate'])
  assert.deepEqual(matchTechs('pythonista', techs), [])
})
