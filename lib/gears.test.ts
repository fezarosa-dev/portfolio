import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gearPath, meshedAngle, meshedPhase, pitchRadius } from './gears.ts'

test('engrenagem engatada gira no sentido oposto e mais rápido se tiver menos dentes', () => {
  assert.equal(meshedAngle(360, 10, 20), -180)
  assert.equal(meshedAngle(360, 10, 5), -720)
})

test('fase: vão da B exatamente oposto ao dente da A', () => {
  assert.equal(meshedPhase(10, 0), 162) // dentes da B em 18 + 36k, vão em 0/180
  assert.equal(pitchRadius(10, 2.4), 12)
})

test('gearPath tem um segmento por ponto de dente', () => {
  assert.equal(gearPath(8, 2).split('L').length, 8 * 4)
})
