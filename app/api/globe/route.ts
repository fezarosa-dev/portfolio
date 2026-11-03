import { buildGlobe, DEFAULT_LAUNCH } from '@/lib/globe'

// o globo é sempre o mesmo (foguete saindo do meio do Brasil): gerado uma vez e cacheado
let svg: string | undefined

export function GET() {
  svg ??= buildGlobe(DEFAULT_LAUNCH)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000',
    },
  })
}
