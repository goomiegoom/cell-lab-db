import { NextRequest, NextResponse } from 'next/server'
import { readSheet, appendRow, getHeaders, SHEETS } from '@/lib/sheets'
import { randomBytes } from 'crypto'

export async function GET() {
  try {
    const log = await readSheet(SHEETS.LOG)
    return NextResponse.json(log)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const headers = await getHeaders(SHEETS.LOG)
    if (!data.status_id) data.status_id = randomBytes(4).toString('hex')
    if (!data.date) data.date = new Date().toISOString().split('T')[0]
    await appendRow(SHEETS.LOG, headers, data)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
