import { NextRequest, NextResponse } from 'next/server'
import { readSheet, appendRow, getHeaders, SHEETS } from '@/lib/sheets'

export async function GET() {
  try {
    const cells = await readSheet(SHEETS.CELLS)
    const stock = await readSheet(SHEETS.STOCK)

    // Count total tubes per cell_id
    const tubeCount: Record<string, number> = {}
    stock.forEach(s => {
      const n = parseFloat(s.num_tubes)
      if (!isNaN(n)) tubeCount[s.cell_id] = (tubeCount[s.cell_id] ?? 0) + n
    })

    const result = cells.map(c => ({
      ...c,
      _total_tubes: tubeCount[c.cell_id] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const headers = await getHeaders(SHEETS.CELLS)
    await appendRow(SHEETS.CELLS, headers, data)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
