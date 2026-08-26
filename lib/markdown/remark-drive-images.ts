import type { Root, Image } from 'mdast'
import { visit } from 'unist-util-visit'
import type { DriveMedia } from '@/lib/drive'

export function remarkDriveImages(files: DriveMedia[]) {
  const byName = new Map(files.map((file) => [file.name, file]))

  return (tree: Root) => {
    visit(tree, 'image', (node: Image) => {
      const isAbsoluteUrl = /^https?:\/\//i.test(node.url)
      if (isAbsoluteUrl) return

      const file = byName.get(node.url)
      if (!file) {
        node.url = '/window.svg'
        return
      }
      node.url = file.mimeType.startsWith('video/')
        ? `/api/drive-video/${file.id}`
        : `/api/drive-image/${file.id}`
    })
  }
}
