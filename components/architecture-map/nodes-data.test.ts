import { test } from 'node:test'
import assert from 'node:assert/strict'
import { architectureNodes, architectureEdges } from './nodes-data.ts'

test('todo id de nó é único', () => {
  const ids = architectureNodes.map((n) => n.id)
  assert.equal(ids.length, new Set(ids).size)
})

test('toda conexão referencia nós que existem', () => {
  const ids = new Set(architectureNodes.map((n) => n.id))
  for (const edge of architectureEdges) {
    assert.ok(ids.has(edge.from), `edge.from desconhecido: ${edge.from}`)
    assert.ok(ids.has(edge.to), `edge.to desconhecido: ${edge.to}`)
  }
})

test('nenhum nó fica fora do mapa (0-100 em x e y)', () => {
  for (const node of architectureNodes) {
    assert.ok(node.x >= 0 && node.x <= 100, `${node.id} com x fora do intervalo`)
    assert.ok(node.y >= 0 && node.y <= 100, `${node.id} com y fora do intervalo`)
  }
})
