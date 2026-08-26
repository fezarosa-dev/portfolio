import { ImageResponse } from 'next/og'

export const OG_IMAGE_SIZE = { width: 1200, height: 630 }
export const OG_IMAGE_CONTENT_TYPE = 'image/png'

export function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export function renderOgImage({
  eyebrow = '$ whoami',
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string | null
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '96px',
          backgroundColor: '#f5f6f8',
          color: '#12151c',
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
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 600, lineHeight: 1.15 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ display: 'flex', fontSize: 32, color: '#4b5563', marginTop: 20 }}>
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
    ),
    OG_IMAGE_SIZE
  )
}
