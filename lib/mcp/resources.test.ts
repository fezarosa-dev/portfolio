import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canRead, canWrite } from './resources.ts'

test('canRead: falso quando o recurso não tem entrada nas permissões', () => {
  assert.equal(canRead({}, 'artigos'), false)
})

test('canRead: verdadeiro só quando read está marcado explicitamente', () => {
  assert.equal(canRead({ artigos: { read: true } }, 'artigos'), true)
  assert.equal(canRead({ artigos: { write: true } }, 'artigos'), false)
})

test('canWrite: verdadeiro só quando write está marcado explicitamente', () => {
  assert.equal(canWrite({ projetos: { write: true } }, 'projetos'), true)
  assert.equal(canWrite({ projetos: { read: true } }, 'projetos'), false)
})

test('leitura/escrita de um recurso não vaza pra outro', () => {
  const permissions = { artigos: { read: true, write: true } }
  assert.equal(canRead(permissions, 'projetos'), false)
  assert.equal(canWrite(permissions, 'projetos'), false)
})
