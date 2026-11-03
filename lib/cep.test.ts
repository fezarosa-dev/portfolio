import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatCep, isCep, lookupCep, normalizeCep } from './cep.ts'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

test('formato do CEP', () => {
  assert.equal(normalizeCep('37.500-000'), '37500000')
  assert.ok(isCep('37500-000'))
  assert.ok(!isCep('3750-000'))
  assert.equal(formatCep('37500000'), '37500-000')
})

test('busca: coordenadas da BrasilAPI; sem elas, cai no Nominatim; CEP inexistente dá erro legível', async () => {
  const brasil = (body: unknown, status = 200) => (async (url: string | URL | Request) =>
    String(url).includes('nominatim') ? json(200, [{ lat: '-22.42', lon: '-45.45' }]) : json(status, body)) as typeof fetch
  const withCoords = await lookupCep('37500-000', brasil({ city: 'Itajubá', state: 'MG', location: { coordinates: { latitude: '-22.4', longitude: '-45.4' } } }))
  assert.deepEqual(withCoords, { cep: '37500000', city: 'Itajubá', state: 'MG', lat: -22.4, lon: -45.4 })
  const noCoords = await lookupCep('37500000', brasil({ city: 'Itajubá', state: 'MG', location: { coordinates: {} } }))
  assert.equal(noCoords.lat, -22.42)
  // BrasilAPI falha: a reserva (ViaCEP) responde "erro" para CEP inexistente
  const down = (async (url: string | URL | Request) =>
    String(url).includes('viacep') ? json(200, { erro: 'true' }) : json(500, {})) as typeof fetch
  await assert.rejects(lookupCep('00000000', down), /não encontrado/)
  const viaOk = (async (url: string | URL | Request) =>
    String(url).includes('viacep') ? json(200, { localidade: 'Itajubá', uf: 'MG' }) : String(url).includes('nominatim') ? json(200, [{ lat: '-22.42', lon: '-45.45' }]) : json(500, {})) as typeof fetch
  assert.deepEqual(await lookupCep('37500903', viaOk), { cep: '37500903', city: 'Itajubá', state: 'MG', lat: -22.42, lon: -45.45 })
  await assert.rejects(lookupCep('123', brasil({})), /inválido/)
})
