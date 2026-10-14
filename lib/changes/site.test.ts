import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteChangesFromForm } from './site-form.ts'
import { overlaySiteContent } from './overlay.ts'
import { enqueue, makeChange } from './queue.ts'
import type { Change } from './types.ts'

const fd = (entries: Record<string, string>, nav: string[] = []) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  for (const href of nav) f.append('nav_hidden_links', href)
  return f
}

test('siteChangesFromForm devolve só o que o usuário mexeu (campos preenchidos por padrão não contam)', () => {
  const current = { contato_email: 'a@b.c', hero_title: 'Oi', hero_title_en: 'Hi', nav_hidden_links: '/artigos' }
  const initial = fd({ contato_email: 'a@b.c', hero_title: 'Oi', hero_title_en: 'Hi', texto_padrao: 'padrão' }, ['/artigos'])
  const changes = siteChangesFromForm(
    fd({ contato_email: 'novo@b.c', hero_title: 'Oi', hero_title_en: 'Hello', texto_padrao: 'padrão' }, ['/artigos']),
    initial,
    current,
    ['contato_email', 'link_github'],
    ['hero_title', 'texto']
  )
  assert.deepEqual(changes.map((c) => c.op), [
    { type: 'site.set', key: 'contato_email', value: 'novo@b.c' },
    { type: 'site.set', key: 'hero_title_en', value: 'Hello' },
  ])
})

test('lado bilíngue vazio apaga a chave (volta ao padrão); "em branco de propósito" grava vazio', () => {
  const current = { hero_title: 'Oi', hero_title_en: 'Hi' }
  const initial = fd({ hero_title: 'Oi', hero_title_en: 'Hi' })
  const f = fd({ hero_title: 'Oi', hero_title_en: '' })
  f.set('hero_title_en_blank', 'true')
  const blank = siteChangesFromForm(f, initial, current, [], ['hero_title'])
  assert.deepEqual(blank.map((c) => c.op), [{ type: 'site.set', key: 'hero_title_en', value: '' }])

  const cleared = siteChangesFromForm(fd({ hero_title: 'Oi', hero_title_en: '' }), initial, current, [], ['hero_title'])
  assert.deepEqual(cleared.map((c) => c.op), [{ type: 'site.delete', key: 'hero_title_en' }])
})

test('overlaySiteContent aplica set/delete e a mesma chave coalesce na fila', () => {
  let n = 0
  const stack = [
    { type: 'site.set', key: 'a', value: '1' },
    { type: 'site.set', key: 'a', value: '2' },
    { type: 'site.delete', key: 'b' },
  ].reduce<Change[]>((s, op) => enqueue(s, makeChange(op as never, 'x', `c${++n}`, n)), [])
  assert.equal(stack.length, 2)
  assert.deepEqual(overlaySiteContent({ a: '0', b: 'x', c: 'y' }, stack), { a: '2', c: 'y' })
})
