import { NextResponse } from 'next/server'
import { getSiteContent } from '@/lib/supabase/queries-cached'

export async function GET() {
  const content = await getSiteContent()
  const dataUrl = content.site_icon

  const match = dataUrl?.match(/^data:(image\/[a-z+]+);base64,(.+)$/)
  if (!match) {
    return NextResponse.json({ error: 'Ícone não configurado' }, { status: 404 })
  }

  const [, mimeType, base64] = match
  return new NextResponse(Buffer.from(base64, 'base64'), {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=300',
    },
  })
}
