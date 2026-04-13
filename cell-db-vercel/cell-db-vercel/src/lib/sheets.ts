import { google } from 'googleapis'

// ── Auth ────────────────────────────────────────────────────
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  const creds = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? ''
export const DRIVE_FOLDER_ID = '1GIkyIJmkZa5-O9LUHHxNfR-WFXH4v90v'

// ── Sheet names ─────────────────────────────────────────────
export const SHEETS = {
  CELLS:      'Cells',
  STOCK:      'Cell_Stock',
  LOG:        'Cell_Status_Log',
  EXPERIMENT: 'Experiment',
  CONDITIONS: 'Experiment_Conditions',
  IMAGES:     'Experiment_Images',
}

// ── Drive helpers ────────────────────────────────────────────
// Extract bare filename from AppSheet path e.g. "Experiment_Images_Images/IMG_001.jpg" → "IMG_001.jpg"
export function extractFilename(appsheetPath: string): string {
  return appsheetPath.includes('/') ? appsheetPath.split('/').pop()! : appsheetPath
}

// Find a Drive file ID by filename (searches within shared folder)
export async function findDriveFileId(filename: string): Promise<string | null> {
  const drive = getDriveClient()
  const res = await drive.files.list({
    q: `name='${filename.replace(/'/g, "\\'")}' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  })
  return res.data.files?.[0]?.id ?? null
}

// Fetch a Drive file as a Buffer (for image proxy)
export async function getDriveFileBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const drive = getDriveClient()
  // Get mime type
  const meta = await drive.files.get({ fileId, fields: 'mimeType' })
  const mimeType = meta.data.mimeType ?? 'image/jpeg'
  // Download content
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  ) as any
  return { buffer: Buffer.from(res.data), mimeType }
}

// ── Generic read ────────────────────────────────────────────
export async function readSheet(sheetName: string) {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  })
  const rows = res.data.values ?? []
  if (rows.length < 2) return []
  const headers = rows[0].map((h: string) => h.trim())
  return rows.slice(1).map((row: string[], i: number) => {
    const obj: Record<string, string> = { _rowIndex: String(i + 2) }
    headers.forEach((h: string, j: number) => {
      obj[h] = row[j] ?? ''
    })
    return obj
  })
}

// ── Append row ──────────────────────────────────────────────
export async function appendRow(sheetName: string, headers: string[], data: Record<string, string>) {
  const sheets = getSheetsClient()
  const row = headers.map(h => data[h] ?? '')
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

// ── Update row ──────────────────────────────────────────────
export async function updateRow(sheetName: string, rowIndex: number, headers: string[], data: Record<string, string>) {
  const sheets = getSheetsClient()
  // First read current row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
  })
  const current: string[] = res.data.values?.[0] ?? []
  // Patch only provided fields
  const updated = headers.map((h, i) => data[h] !== undefined ? data[h] : (current[i] ?? ''))
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [updated] },
  })
}

// ── Delete row ──────────────────────────────────────────────
export async function deleteRow(sheetName: string, rowIndex: number) {
  const sheets = getSheetsClient()
  // Get the sheetId by name first
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName)
  const sheetId = sheet?.properties?.sheetId
  if (sheetId === undefined) throw new Error(`Sheet "${sheetName}" not found`)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,  // 0-indexed
            endIndex: rowIndex,
          },
        },
      }],
    },
  })
}

// ── Get headers for a sheet ─────────────────────────────────
export async function getHeaders(sheetName: string): Promise<string[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:1`,
  })
  return (res.data.values?.[0] ?? []).map((h: string) => h.trim())
}
