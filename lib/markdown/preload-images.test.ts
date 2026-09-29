import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractDriveImageUrls } from './preload-images.ts'

const files = [
  { id: 'a1', name: 'foto.jpg', thumbnailLink: '', mimeType: 'image/jpeg' },
  { id: 'v1', name: 'demo.mp4', thumbnailLink: '', mimeType: 'video/mp4' },
]

test('extrai só imagens do Drive citadas, sem repetir, ignorando vídeo, URL absoluta e nome desconhecido', () => {
  const md = '![x](foto.jpg) texto ![y](foto.jpg) ![v](demo.mp4) ![z](https://a.com/b.png) ![w](nada.png)'
  assert.deepEqual(extractDriveImageUrls([md, null], files), ['/api/drive-image/a1'])
})
