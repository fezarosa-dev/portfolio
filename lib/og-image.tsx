import { ImageResponse } from 'next/og'
import { fetchDriveImage, listDriveImages } from '@/lib/drive'

export const OG_IMAGE_SIZE = { width: 1200, height: 630 }
export const OG_IMAGE_CONTENT_TYPE = 'image/png'

const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)/

export function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Acha a primeira imagem de um markdown (URL absoluta ou nome de arquivo do Drive) e a embute como data URI. */
export async function resolveMarkdownImage(
  markdown: string | null | undefined,
  folderId: string | null
): Promise<string | null> {
  const ref = markdown?.match(MARKDOWN_IMAGE_RE)?.[1]
  if (!ref) return null
  if (/^https?:\/\//i.test(ref)) return ref
  if (!folderId) return null

  try {
    const images = await listDriveImages(folderId)
    const image = images.find((img) => img.name === ref)
    if (!image) return null
    const res = await fetchDriveImage(image.id)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export function renderOgImage({
  eyebrow = '$ whoami',
  title,
  subtitle,
  imageSrc,
}: {
  eyebrow?: string
  title: string
  subtitle?: string | null
  imageSrc?: string | null
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#f5f6f8',
          color: '#12151c',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: imageSrc ? '80px 56px' : '96px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#f2661d',
              fontFamily: 'monospace',
              marginBottom: 24,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: imageSrc ? 52 : 64,
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', fontSize: 28, color: '#4b5563', marginTop: 20 }}>
              {subtitle}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: '#f2661d',
              fontFamily: 'monospace',
              marginTop: 56,
            }}
          >
            zanoni.dev.br
          </div>
        </div>
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} width={460} height={630} style={{ objectFit: 'cover' }} />
        )}
      </div>
    ),
    OG_IMAGE_SIZE
  )
}
