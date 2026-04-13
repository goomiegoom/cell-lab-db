import { google } from 'googleapis'

// ── Auth ────────────────────────────────────────────────────
// Credentials come from a single env var: GOOGLE_SERVICE_ACCOUNT_JSON
// (paste the entire service account JSON as one line in Vercel env vars)
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  const creds = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? ''

// ── Sheet names ─────────────────────────────────────────────
export const SHEETS = {
  CELLS:  'Cells',
  STOCK:  'Cell_Stock',
  LOG:    'Cell_Status_Log',
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
