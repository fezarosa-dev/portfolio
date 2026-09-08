import { test } from 'node:test'
import assert from 'node:assert/strict'

test('createPublicClient retorna um client com API de query', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://exemplo.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'chave-anon-fake'
  const { createPublicClient } = await import('./public-client.ts')
  const client = createPublicClient()
  assert.equal(typeof client.from, 'function')
  assert.equal(typeof client.rpc, 'function')
})
