import { test } from 'node:test'
import assert from 'node:assert/strict'
import { remarkDriveImages } from './remark-drive-images.ts'
import type { Root, Image } from 'mdast'

function makeTree(url: string): Root {
  const image: Image = { type: 'image', url, children: [] } as unknown as Image
  return { type: 'root', children: [image as never] }
}

test('resolve nome de arquivo de imagem para a rota de proxy usando o id correspondente', () => {
  const tree = makeTree('foto.jpg')
  remarkDriveImages([{ id: 'abc123', name: 'foto.jpg', thumbnailLink: '', mimeType: 'image/jpeg' }])(
    tree
  )
  const image = tree.children[0] as unknown as Image
  assert.equal(image.url, '/api/drive-image/abc123')
})

test('resolve nome de arquivo de vídeo para a rota de proxy de vídeo', () => {
  const tree = makeTree('clipe.mp4')
  remarkDriveImages([{ id: 'vid123', name: 'clipe.mp4', thumbnailLink: '', mimeType: 'video/mp4' }])(
    tree
  )
  const image = tree.children[0] as unknown as Image
  assert.equal(image.url, '/api/drive-video/vid123')
})

test('deixa URL absoluta http(s) intacta', () => {
  const tree = makeTree('https://example.com/foto.jpg')
  remarkDriveImages([{ id: 'abc123', name: 'foto.jpg', thumbnailLink: '', mimeType: 'image/jpeg' }])(
    tree
  )
  const image = tree.children[0] as unknown as Image
  assert.equal(image.url, 'https://example.com/foto.jpg')
})

test('nome sem correspondência na listagem vira o placeholder', () => {
  const tree = makeTree('nao-existe.jpg')
  remarkDriveImages([{ id: 'abc123', name: 'foto.jpg', thumbnailLink: '', mimeType: 'image/jpeg' }])(
    tree
  )
  const image = tree.children[0] as unknown as Image
  assert.equal(image.url, '/window.svg')
})
