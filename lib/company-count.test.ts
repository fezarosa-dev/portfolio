import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countClients } from './company-count.ts'

const company = (id: string) => ({ id, name: id, name_en: null, url: null })

test('grupos de clientes contam separado dentro da mesma empresa', () => {
  const freela = company('freela')
  assert.equal(
    countClients([
      { client_id: 'a', company: freela },
      { client_id: 'a', company: freela },
      { client_id: 'b', company: freela },
    ]),
    2
  )
})

test('sem grupo conta pela empresa; vários projetos da mesma empresa contam um', () => {
  assert.equal(
    countClients([
      { client_id: null, company: company('sage') },
      { client_id: null, company: company('sage') },
      { client_id: null, company: company('pessoal') },
      { client_id: null, company: company('pessoal') },
    ]),
    2
  )
})

test('grupo e projetos sem grupo da mesma empresa somam; projeto sem empresa não conta', () => {
  const freela = company('freela')
  assert.equal(
    countClients([
      { client_id: 'a', company: freela },
      { client_id: null, company: freela },
      { client_id: null, company: null },
    ]),
    2
  )
})

test('relatório: mesma conta do site, explica quem conta e avisa configuração estranha', async () => {
  const { clientBreakdown } = await import('./company-count.ts')
  const freela = company('freela')
  const sage = company('sage')
  const p = (id: string, c: ReturnType<typeof company> | null, client_id: string | null, visible = true) => ({
    id,
    title: id,
    title_en: null,
    visible,
    client_id,
    company: c,
  })
  const projects = [
    p('a1', freela, 'A'),
    p('a2', freela, 'A'),
    p('solto', freela, null),
    p('s1', sage, null),
    p('s2', sage, null),
    p('oculto', sage, null, false),
    p('orfao', null, null),
  ]
  const clients = [
    { id: 'A', company_id: 'freela', name: 'Cliente A' },
    { id: 'B', company_id: 'freela', name: 'Cliente B' },
  ]
  const r = clientBreakdown(projects, [freela, sage], clients)
  assert.equal(r.total, countClients(projects.filter((x) => x.visible)))
  assert.equal(r.total, 3)
  assert.deepEqual(
    r.units.map((u) => [u.kind, u.label, u.projects]),
    [
      ['group', 'Cliente A', ['a1', 'a2']],
      ['company', 'freela', ['solto']],
      ['company', 'sage', ['s1', 's2']],
    ]
  )
  assert.deepEqual(r.notCounted, [
    { project: 'oculto', reason: 'oculto no site' },
    { project: 'orfao', reason: 'sem empresa' },
  ])
  assert.equal(r.warnings.length, 2)
  assert.match(r.warnings[0], /1 projeto\(s\) sem grupo.*solto/)
  assert.match(r.warnings[1], /Cliente B.*não conta/)
})
