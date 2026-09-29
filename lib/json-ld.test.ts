import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsonLd } from './json-ld.ts'

test('escapa < e o resultado continua sendo o mesmo JSON', () => {
  const data = { name: 'x</script><script>alert(1)</script>' }
  const out = jsonLd(data)
  assert.ok(!out.includes('<'))
  assert.deepEqual(JSON.parse(out), data)
})
