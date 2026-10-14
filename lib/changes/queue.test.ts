import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enqueue, makeChange, revoke, sendOrder, settle } from './queue.ts'
import type { ChangeOp } from './types.ts'

let n = 0
const ch = (op: ChangeOp) => makeChange(op, 'x', `id${++n}`, n)

const add: ChangeOp = { type: 'language.add', id: 'L1', name: 'Rust', nameEn: '', iconUrl: '' }
const rename = (value: string): ChangeOp => ({ type: 'language.update', id: 'L1', field: 'name', value })
const remove: ChangeOp = { type: 'language.remove', id: 'L1' }

test('enqueue coloca a mudança mais recente em cima da pilha', () => {
  const a = ch(rename('A'))
  const b = ch({ type: 'language.order', ids: ['L1'] })
  assert.deepEqual(enqueue(enqueue([], a), b).map((c) => c.id), [b.id, a.id])
})

test('editar o mesmo campo de novo substitui a entrada anterior e sobe pro topo', () => {
  const first = ch(rename('A'))
  const other = ch({ type: 'language.update', id: 'L1', field: 'nameEn', value: 'x' })
  const second = ch(rename('B'))
  const stack = enqueue(enqueue(enqueue([], first), other), second)
  assert.deepEqual(stack.map((c) => c.id), [second.id, other.id])
})

test('criar e apagar antes de enviar cancela tudo (nada vai pro banco)', () => {
  const a = ch(add)
  const u = ch(rename('Rust 2'))
  const r = ch(remove)
  const stack = enqueue(enqueue(enqueue([], a), u), r)
  assert.deepEqual(stack, [])
})

test('apagar algo que já existe descarta as edições pendentes dele e mantém as de outros', () => {
  const edit = ch(rename('B'))
  const otherEdit = ch({ type: 'language.update', id: 'L2', field: 'name', value: 'Z' })
  const r = ch(remove)
  const stack = enqueue(enqueue(enqueue([], edit), otherEdit), r)
  assert.deepEqual(stack.map((c) => c.id), [r.id, otherEdit.id])
})

test('revogar a criação leva junto o que dependia dela; revogar edição tira só ela', () => {
  const a = ch(add)
  const u = ch(rename('Rust 2'))
  const stack = enqueue(enqueue([], a), u)
  assert.deepEqual(revoke(stack, a.id), [])
  assert.deepEqual(revoke(stack, u.id).map((c) => c.id), [a.id])
  assert.deepEqual(revoke(stack, 'inexistente'), stack)
})

test('sendOrder envia do mais antigo pro mais novo', () => {
  const a = ch(rename('A'))
  const b = ch({ type: 'language.order', ids: ['L1'] })
  const stack = enqueue(enqueue([], a), b)
  assert.deepEqual(sendOrder(stack).map((c) => c.id), [a.id, b.id])
})

test('settle remove as enviadas, marca erro nas que falharam e não toca nas demais', () => {
  const a = ch(rename('A'))
  const b = ch({ type: 'language.order', ids: ['L1'] })
  const c = ch({ type: 'category.update', id: 'C1', field: 'name', value: 'N' })
  const stack = enqueue(enqueue(enqueue([], a), b), c)
  const next = settle(stack, [
    { id: a.id, ok: true },
    { id: b.id, ok: false, error: 'falhou' },
  ])
  assert.deepEqual(next.map((x) => x.id), [c.id, b.id])
  assert.equal(next.find((x) => x.id === b.id)?.status, 'error')
  assert.equal(next.find((x) => x.id === b.id)?.error, 'falhou')
  assert.equal(next.find((x) => x.id === c.id)?.status, 'pending')
})
