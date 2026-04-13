import { NextRequest, NextResponse } from 'next/server'
import { getDriveFileBuffer } from '@/lib/sheets'

export async function GET(_req: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { buffer, mimeType } = await getDriveFileBuffer(params.fileId)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', // cache 24h
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
