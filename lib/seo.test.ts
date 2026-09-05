import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localizedAlternates } from './seo.ts'

test('localizedAlternates monta canonical e alternates de idioma pro pt', () => {
  assert.deepEqual(localizedAlternates('pt', '/projetos'), {
    canonical: '/pt/projetos',
    languages: { pt: '/pt/projetos', en: '/en/projetos', 'x-default': '/pt/projetos' },
  })
})

test('localizedAlternates monta canonical e alternates de idioma pro en', () => {
  assert.deepEqual(localizedAlternates('en', '/projetos'), {
    canonical: '/en/projetos',
    languages: { pt: '/pt/projetos', en: '/en/projetos', 'x-default': '/pt/projetos' },
  })
})

test('localizedAlternates funciona com path vazio (home)', () => {
  assert.deepEqual(localizedAlternates('pt', ''), {
    canonical: '/pt',
    languages: { pt: '/pt', en: '/en', 'x-default': '/pt' },
  })
})
