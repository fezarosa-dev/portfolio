import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstSentences } from './short-text.ts'

test('corta no fim de frase; sem frase que caiba, corta na palavra com reticências', () => {
  assert.equal(firstSentences('Curto.', 50), 'Curto.')
  assert.equal(firstSentences('Uma frase. Outra frase maior que passa.', 20), 'Uma frase.')
  assert.equal(firstSentences('Uma frase só que é comprida demais para caber', 20), 'Uma frase só que é…')
  assert.equal(firstSentences('Versão 1.5 do app. Segunda.', 20), 'Versão 1.5 do app.')
})
