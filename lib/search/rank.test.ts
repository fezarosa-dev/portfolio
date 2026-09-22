import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reciprocalRankFusion } from './rank.ts'

test('reciprocalRankFusion: item no topo das duas listas fica em 1º no resultado', () => {
  const fullText = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const semantic = [{ id: 'a' }, { id: 'c' }, { id: 'b' }]
  const result = reciprocalRankFusion(fullText, semantic)
  assert.equal(result[0].id, 'a')
})

test('reciprocalRankFusion: item presente nas duas listas ranqueia acima de item de só uma', () => {
  const fullText = [{ id: 'x' }, { id: 'shared' }]
  const semantic = [{ id: 'shared' }]
  const result = reciprocalRankFusion(fullText, semantic)
  assert.equal(result[0].id, 'shared')
})

test('reciprocalRankFusion: item presente em só uma lista ainda aparece no resultado final', () => {
  const result = reciprocalRankFusion([{ id: 'a' }], [{ id: 'b' }])
  assert.equal(result.length, 2)
  assert.deepEqual(new Set(result.map((r) => r.id)), new Set(['a', 'b']))
})

test('reciprocalRankFusion: duas listas vazias devolvem lista vazia', () => {
  assert.deepEqual(reciprocalRankFusion([], []), [])
})
