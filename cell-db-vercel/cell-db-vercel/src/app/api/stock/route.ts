import { NextRequest, NextResponse } from 'next/server'
import { readSheet, appendRow, getHeaders, SHEETS } from '@/lib/sheets'

export async function GET() {
  try {
    const stock = await readSheet(SHEETS.STOCK)
    const cells = await readSheet(SHEETS.CELLS)
    const cellMap: Record<string, any> = {}
    cells.forEach(c => { cellMap[c.cell_id] = c })

    const result = stock.map(s => ({
      ...s,
      _host:      cellMap[s.cell_id]?.host_species ?? '',
      _tissue:    cellMap[s.cell_id]?.tissue_origin ?? '',
      _cell_name: cellMap[s.cell_id]?.cell_name ?? s.cell_id,
    }))

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const headers = await getHeaders(SHEETS.STOCK)
    // Auto-generate stock_id if blank
    if (!data.stock_id) {
      const stock = await readSheet(SHEETS.STOCK)
      data.stock_id = `STK_${String(stock.length + 1).padStart(4, '0')}`
    }
    await appendRow(SHEETS.STOCK, headers, data)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
