import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clientIp, isSameOriginJson } from './request-guard.ts'

const req = (headers: Record<string, string>) => new Request('http://x/api', { method: 'POST', headers, body: '{}' })

test('aceita JSON do mesmo host', () => {
  assert.equal(isSameOriginJson(req({ 'content-type': 'application/json', origin: 'https://a.com', host: 'a.com' })), true)
})

test('recusa Origin de outro site', () => {
  assert.equal(isSameOriginJson(req({ 'content-type': 'application/json', origin: 'https://evil.com', host: 'a.com' })), false)
})

test('recusa content-type que não é JSON (form cross-site)', () => {
  assert.equal(isSameOriginJson(req({ 'content-type': 'text/plain', origin: 'https://a.com', host: 'a.com' })), false)
})

test('sem Origin: aceita curl, recusa Sec-Fetch-Site cross-site', () => {
  assert.equal(isSameOriginJson(req({ 'content-type': 'application/json' })), true)
  assert.equal(isSameOriginJson(req({ 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' })), false)
})

test('clientIp usa o 1º do x-forwarded-for e cai em unknown', () => {
  assert.equal(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })), '1.2.3.4')
  assert.equal(clientIp(req({})), 'unknown')
})
