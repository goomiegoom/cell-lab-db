import { NextRequest, NextResponse } from 'next/server'
import { readSheet, findDriveFileId, extractFilename, SHEETS } from '@/lib/sheets'

export async function GET(
  _req: NextRequest,
  { params }: { params: { cell_id: string } }
) {
  try {
    const cellId = params.cell_id

    // Fetch all sheets in parallel
    const [cells, stock, log, experiments, conditions, images] = await Promise.all([
      readSheet(SHEETS.CELLS),
      readSheet(SHEETS.STOCK),
      readSheet(SHEETS.LOG),
      readSheet(SHEETS.EXPERIMENT),
      readSheet(SHEETS.CONDITIONS),
      readSheet(SHEETS.IMAGES),
    ])

    // Find the cell
    const cell = cells.find(c => c.cell_id === cellId)
    if (!cell) return NextResponse.json({ error: 'Cell not found' }, { status: 404 })

    // Filter stock and log for this cell
    const cellStock = stock.filter(s => s.cell_id === cellId)
    const cellLog   = log.filter(l => l.cell_id === cellId)

    // Find all conditions for this cell
    const cellConditions = conditions.filter(c => c.cell_id === cellId)
    const conditionIds   = new Set(cellConditions.map(c => c.condition_id))

    // Find images for those conditions
    const cellImages = images.filter(img => conditionIds.has(img.condition_id))

    // Resolve Drive file IDs for each image (in parallel, cap to avoid rate limits)
    const resolvedImages: (Record<string, string> & { fileId: string | null })[] = await Promise.all(
      cellImages.map(async img => {
        let fileId: string | null = null
        if (img.image_url) {
          const filename = extractFilename(img.image_url)
          fileId = await findDriveFileId(filename).catch(() => null)
        }
        return { ...img, fileId }
      })
    )

    // Build experiment lookup
    const expMap: Record<string, any> = {}
    experiments.forEach(e => { expMap[e.exp_id] = e })

    // Group conditions by experiment, attach their images
    const experimentGroups = cellConditions.map(cond => {
      const exp = expMap[cond.exp_id] ?? {}
      const condImages = resolvedImages.filter(img => img.condition_id === cond.condition_id)
      return { ...cond, experiment: exp, images: condImages }
    })

    return NextResponse.json({
      cell,
      stock: cellStock,
      log: cellLog,
      experiments: experimentGroups,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
