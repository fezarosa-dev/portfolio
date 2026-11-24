import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveShortLink, shortLinkPath } from './short-link.ts'

test('link curto com idioma respeita o idioma do link, não o de quem abre', () => {
  assert.equal(resolveShortLink('/en/p/meu-projeto', 'pt'), '/en/projetos/meu-projeto')
  assert.equal(resolveShortLink('/pt/p/meu-projeto', 'en'), '/pt/projetos/meu-projeto')
})

test('link curto antigo sem idioma usa o idioma de quem abre', () => {
  assert.equal(resolveShortLink('/p/Meu-Projeto', 'en'), '/en/projetos/meu-projeto')
})

test('o que não é link curto passa reto', () => {
  assert.equal(resolveShortLink('/en/projetos/x', 'pt'), null)
  assert.equal(resolveShortLink('/en/p', 'pt'), null)
  assert.equal(resolveShortLink('/p', 'pt'), null)
  assert.equal(resolveShortLink('/sobre', 'pt'), null)
})

test('o botão gera o link curto no idioma da página e ele volta pro mesmo projeto', () => {
  assert.equal(resolveShortLink(shortLinkPath('en', 'abc'), 'pt'), '/en/projetos/abc')
})
