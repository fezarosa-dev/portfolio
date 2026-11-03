import { getSiteContent } from '@/lib/supabase/queries-cached'
import { buildGlobe, launchFrom } from '@/lib/globe'

// o desenho muda só quando muda o ponto de lançamento; a home pede com ?v=<lat,lon>, então cada versão pode ficar
// em cache por muito tempo
const cache = new Map<string, string>()

export async function GET() {
  const launch = launchFrom(await getSiteContent())
  const key = `${launch.lat},${launch.lon}`
  let svg = cache.get(key)
  if (!svg) {
    svg = buildGlobe(launch)
    cache.clear()
    cache.set(key, svg)
  }
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
    },
  })
}
