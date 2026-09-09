import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickSource } from './pick-source.ts'

test('pickSource: draft mode ligado usa a fonte crua', () => {
  assert.equal(pickSource(true, 'raw', 'cached'), 'raw')
})

test('pickSource: draft mode desligado usa a fonte cacheada', () => {
  assert.equal(pickSource(false, 'raw', 'cached'), 'cached')
})
