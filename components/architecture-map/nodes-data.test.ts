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

test('todo nó tem pelo menos 2 passos "micro" (o que o código faz), em pt e en', () => {
  for (const node of architectureNodes) {
    assert.ok(node.microSteps.length >= 2, `${node.id} tem poucos microSteps`)
    for (const step of node.microSteps) {
      assert.ok(step.label.pt.length > 0, `${node.id} tem microStep sem label.pt`)
      assert.ok(step.label.en.length > 0, `${node.id} tem microStep sem label.en`)
      assert.ok(step.detail.pt.length > 0, `${node.id} tem microStep sem detail.pt`)
      assert.ok(step.detail.en.length > 0, `${node.id} tem microStep sem detail.en`)
    }
  }
})

test('todo nó tem label/summary/detail em pt e en', () => {
  for (const node of architectureNodes) {
    for (const field of [node.label, node.summary, node.detail]) {
      assert.ok(field.pt.length > 0, `${node.id} tem campo sem pt`)
      assert.ok(field.en.length > 0, `${node.id} tem campo sem en`)
    }
  }
})

test('toda conexão tem label em pt e en', () => {
  for (const edge of architectureEdges) {
    assert.ok(edge.label.pt.length > 0, `edge ${edge.from}->${edge.to} sem label.pt`)
    assert.ok(edge.label.en.length > 0, `edge ${edge.from}->${edge.to} sem label.en`)
  }
})

test('todo nó tem uma direção de expansão do pipeline diferente de zero', () => {
  for (const node of architectureNodes) {
    const magnitude = Math.abs(node.dir.dx) + Math.abs(node.dir.dy)
    assert.ok(magnitude > 0, `${node.id} tem dir zerado (pipeline ficaria empilhado nele mesmo)`)
  }
})
