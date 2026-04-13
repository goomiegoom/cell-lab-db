import { NextRequest, NextResponse } from 'next/server'
import { updateRow, deleteRow, getHeaders, SHEETS } from '@/lib/sheets'

export async function PATCH(req: NextRequest, { params }: { params: { row: string } }) {
  try {
    const rowIndex = parseInt(params.row)
    const data = await req.json()
    const headers = await getHeaders(SHEETS.CELLS)
    await updateRow(SHEETS.CELLS, rowIndex, headers, data)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { row: string } }) {
  try {
    const rowIndex = parseInt(params.row)
    await deleteRow(SHEETS.CELLS, rowIndex)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
