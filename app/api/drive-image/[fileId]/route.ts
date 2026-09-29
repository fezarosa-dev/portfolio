import { NextResponse } from 'next/server'
import { fetchDriveImage, isAllowedDriveFile, parseDriveFolderId } from '@/lib/drive'
import { getSiteContent } from '@/lib/supabase/queries-cached'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  const content = await getSiteContent()
  const folderId = content.drive_folder_url ? parseDriveFolderId(content.drive_folder_url) : null
  if (!(await isAllowedDriveFile(fileId, folderId))) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }
  const res = await fetchDriveImage(fileId)

  if (!res.ok || !res.body) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
