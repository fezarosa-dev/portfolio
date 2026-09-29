import type { DriveMedia } from '@/lib/drive'

const IMAGE_RE = /!\[[^\]]*\]\(\s*([^)\s]+)/g

/** URLs `/api/drive-image/<id>` das imagens (não vídeos) do Drive citadas nos markdowns, sem repetir. */
export function extractDriveImageUrls(markdowns: (string | null | undefined)[], files: DriveMedia[]): string[] {
  const byName = new Map(files.filter((f) => !f.mimeType.startsWith('video/')).map((f) => [f.name, f.id]))
  const urls = new Set<string>()
  for (const md of markdowns) {
    for (const match of (md ?? '').matchAll(IMAGE_RE)) {
      const id = byName.get(match[1])
      if (id) urls.add(`/api/drive-image/${id}`)
    }
  }
  return [...urls]
}
