import { test } from 'node:test'
import assert from 'node:assert/strict'
import { homeWarning } from './home-servers.ts'

const p = (visible: boolean, show_on_home: boolean) => ({ visible, show_on_home })

test('avisa com menos de 4 na home (oculto não conta), com mais de 4, e fica quieto com 4', () => {
  assert.match(homeWarning([p(true, true), p(false, true), p(true, false)]) ?? '', /incompleta: 1 de 4/)
  assert.equal(homeWarning([p(true, true), p(true, true), p(true, true), p(true, true)]), null)
  assert.match(homeWarning(Array.from({ length: 5 }, () => p(true, true))) ?? '', /mostra só 4/)
})
