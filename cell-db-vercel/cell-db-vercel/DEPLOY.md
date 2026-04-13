# Deployment Guide — Cell Lab DB on Vercel

Total time: ~15 minutes

---

## Step 1 — Prepare your Google Sheet

Make sure your sheet has these exact tab names (case-sensitive):
- `Cells`
- `Cell_Stock`
- `Cell_Status_Log`

If your tabs are named differently, edit `src/lib/sheets.ts` and change the `SHEETS` object.

---

## Step 2 — Create a Google Cloud Service Account

This is a one-time setup that lets the app read/write your sheet.

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one) — name it anything, e.g. "Cell Lab DB"
3. In the search bar, search for **"Google Sheets API"** → click Enable
4. Go to **IAM & Admin → Service Accounts**
5. Click **"Create Service Account"**
   - Name: `cell-lab-db` (anything)
   - Click "Create and Continue" → skip the optional steps → Done
6. Click on the service account you just created
7. Go to the **Keys** tab → **Add Key → Create new key → JSON**
8. A `.json` file downloads — keep it safe, you'll need it shortly

---

## Step 3 — Share your Google Sheet with the service account

1. Open the downloaded JSON file in a text editor
2. Find the `"client_email"` field — it looks like:
   `cell-lab-db@your-project.iam.gserviceaccount.com`
3. Open your Google Sheet
4. Click **Share** (top right)
5. Paste that email address → set role to **Editor** → Send

---

## Step 4 — Get your Spreadsheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/  SPREADSHEET_ID_IS_HERE  /edit
```
Copy that middle part — that's your `SPREADSHEET_ID`.

---

## Step 5 — Push to GitHub

```bash
cd cell-db-vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cell-lab-db.git
git push -u origin main
```

---

## Step 6 — Deploy to Vercel

1. Go to https://vercel.com → Sign up / Log in with GitHub
2. Click **"Add New Project"**
3. Import your `cell-lab-db` repository
4. Framework preset: **Next.js** (auto-detected)
5. Before clicking Deploy, open **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `SPREADSHEET_ID` | your spreadsheet ID from Step 4 |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | the **entire contents** of the JSON file from Step 2, as one line |

   For the JSON: open it in a text editor, select all, copy, paste as the value.
   Vercel handles multi-line values fine.

6. Click **Deploy**

Vercel builds and deploys in ~1 minute. You get a URL like:
`https://cell-lab-db-yourusername.vercel.app`

Share that URL with your team — no login required.

---

## Step 7 — Test it

- Open the URL
- Check that cells load on the Cells page
- Try adding a new entry
- Verify it appears in your Google Sheet

---

## Updating the app

After making code changes:
```bash
git add .
git commit -m "Your change description"
git push
```
Vercel auto-deploys on every push. The URL stays the same.

---

## Running locally for development

```bash
npm install
cp .env.example .env.local
# Fill in SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON in .env.local
npm run dev
```
Open http://localhost:3000

---

## Troubleshooting

**"GOOGLE_SERVICE_ACCOUNT_JSON env var is not set"**
→ Check Vercel environment variables are saved and redeploy

**"The caller does not have permission"**
→ Make sure you shared the Sheet with the service account email (Step 3), with Editor role

**"Sheet 'Cells' not found"**
→ Your Google Sheet tab name doesn't match. Edit `src/lib/sheets.ts` → `SHEETS` object

**Data loads but edits don't save**
→ Check the service account has Editor (not Viewer) access to the sheet

**Blank page / build error**
→ Check Vercel build logs. Most common cause: malformed JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`
   (make sure you copied the entire file contents, including the outer `{ }`)
