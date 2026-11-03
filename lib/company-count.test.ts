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
