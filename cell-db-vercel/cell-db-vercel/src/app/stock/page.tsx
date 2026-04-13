'use client'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import CheckboxFilter from '@/components/CheckboxFilter'
import { HostPill, SStatusPill } from '@/components/Pill'

const PS = 25

const STOCK_FIELDS = [
  { id: 'stock_id',      label: 'Stock ID' },
  { id: 'cell_id',       label: 'Cell ID',          type: 'cellid' },
  { id: 'stock type',    label: 'Stock type',        opts: ['Cell','Virus'] },
  { id: 'freezer_name',  label: 'Freezer',           opts: ['-80 Upper Drawer','-80 Stack'] },
  { id: 'box_name',      label: 'Box' },
  { id: 'num_tubes',     label: 'Num tubes' },
  { id: 'concentration', label: 'Conc. (cells/mL)' },
  { id: 'date_frozen',   label: 'Date frozen',       type: 'date' },
  { id: 'status',        label: 'Status',            opts: ['FINAL PLATE','Plate OK','Plate checked','VERY GOOD','Need to restock','Need to reculture','Plate checking','RE-CULTURE','Done RE-CULTURED','CONTAMINATION','No Record','NOT DIFF','LOW TITER','Original'] },
  { id: 'label_notes',   label: 'Label notes',       full: true },
]

export default function StockPage() {
  const [rows, setRows] = useState<any[]>([])
  const [cellIds, setCellIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selHost,    setSelHost]    = useState<Set<string>>(new Set())
  const [selStatus,  setSelStatus]  = useState<Set<string>>(new Set())
  const [selFreezer, setSelFreezer] = useState<Set<string>>(new Set())
  const [sortCol, setSortCol] = useState('stock_id')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<null | 'add' | number>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState<any>(null)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [sRes, cRes] = await Promise.all([fetch('/api/stock'), fetch('/api/cells')])
      const [stock, cells] = await Promise.all([sRes.json(), cRes.json()])
      setRows(stock)
      setCellIds([...new Set<string>(cells.map((c: any) => c.cell_id).filter(Boolean))].sort())
    } catch { showToast('Failed to load', true) }
    setLoading(false)
  }

  function showToast(msg: string, err?: boolean) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const hosts    = useMemo(() => [...new Set(rows.map(r => r._host).filter(Boolean))].sort(), [rows])
  const statuses = useMemo(() => [...new Set(rows.map(r => r.status).filter(Boolean))].sort(), [rows])
  const freezers = useMemo(() => [...new Set(rows.map(r => r.freezer_name).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    let r = rows.filter(row => {
      const q = search.toLowerCase()
      if (q && !['stock_id','cell_id','box_name','label_notes'].some(k => (row[k]||'').toLowerCase().includes(q))) return false
      if (selHost.size    && !selHost.has(row._host))          return false
      if (selStatus.size  && !selStatus.has(row.status))       return false
      if (selFreezer.size && !selFreezer.has(row.freezer_name)) return false
      return true
    })
    return r.sort((a, b) => {
      const av = (a[sortCol]||'').toString(), bv = (b[sortCol]||'').toString()
      const n = parseFloat(av) - parseFloat(bv)
      const cmp = isNaN(n) ? av.localeCompare(bv) : n
      return sortAsc ? cmp : -cmp
    })
  }, [rows, search, selHost, selStatus, selFreezer, sortCol, sortAsc])

  const pageRows = filtered.slice((page-1)*PS, page*PS)
  const totalPages = Math.ceil(filtered.length / PS)
  const totalTubes = rows.reduce((a, r) => a + (parseFloat(r.num_tubes)||0), 0)

  function sort(col: string) { setSortAsc(sortCol===col?!sortAsc:true); setSortCol(col); setPage(1) }

  function removeTag(key: string, val: string) {
    if (key==='host')    setSelHost(s    => { const n=new Set(s); n.delete(val); return n })
    if (key==='status')  setSelStatus(s  => { const n=new Set(s); n.delete(val); return n })
    if (key==='freezer') setSelFreezer(s => { const n=new Set(s); n.delete(val); return n })
  }

  const activeTags = [
    ...[...selHost].map(v    => ({ key: 'host',    val: v })),
    ...[...selStatus].map(v  => ({ key: 'status',  val: v })),
    ...[...selFreezer].map(v => ({ key: 'freezer', val: v })),
  ]

  async function save() {
    setSaving(true)
    try {
      const isEdit = typeof modal === 'number'
      const res = await fetch(isEdit ? `/api/stock/${modal}` : '/api/stock', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setModal(null); showToast('Saved ✓'); load()
    } catch (e: any) { showToast(e.message, true) }
    setSaving(false)
  }

  async function confirmDelete() {
    if (!delTarget) return
    try {
      const res = await fetch(`/api/stock/${delTarget._rowIndex}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDelTarget(null); showToast('Deleted'); load()
    } catch (e: any) { showToast(e.message, true) }
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="page-hdr">
          <div><h1>Cell <em>Stock</em></h1><p>Physical tube inventory</p></div>
          <button className="btn primary" onClick={() => { setForm({}); setModal('add') }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
            Add stock
          </button>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-val">{rows.length}</div><div className="stat-lbl">Entries</div></div>
          <div className="stat"><div className="stat-val">{totalTubes}</div><div className="stat-lbl">Total tubes</div></div>
          <div className="stat"><div className="stat-val">{rows.filter(r=>r.status==='FINAL PLATE').length}</div><div className="stat-lbl">Final plate</div></div>
          <div className="stat"><div className="stat-val">{rows.filter(r=>r.status==='Need to restock').length}</div><div className="stat-lbl">Need restock</div></div>
          <div className="stat"><div className="stat-val">{filtered.length}</div><div className="stat-lbl">Showing</div></div>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3 3"/></svg>
            <input placeholder="Search ID, cell, box, notes…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/>
          </div>
          <CheckboxFilter id="shost"   label="Host"    values={hosts}    selected={selHost}    onChange={s => { setSelHost(s);    setPage(1) }} searchable />
          <CheckboxFilter id="sstatus" label="Status"  values={statuses}  selected={selStatus}  onChange={s => { setSelStatus(s);  setPage(1) }} searchable />
          <CheckboxFilter id="freezer" label="Freezer" values={freezers}  selected={selFreezer} onChange={s => { setSelFreezer(s); setPage(1) }} />
        </div>

        {activeTags.length > 0 && (
          <div className="filter-tags">
            {activeTags.map(t => (
              <div key={t.key+t.val} className="tag">
                {t.key}: <strong>{t.val}</strong>
                <button onClick={() => removeTag(t.key, t.val)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="table-wrap">
          {loading ? <div className="loading"><div className="spinner"/><span>Loading…</span></div> : (
            <table>
              <thead>
                <tr>
                  {[['stock_id','Stock ID'],['cell_id','Cell'],['_host','Host'],['freezer_name','Freezer'],['box_name','Box'],['num_tubes','Tubes'],['concentration','Conc.'],['date_frozen','Frozen'],['status','Status']].map(([col,lbl]) => (
                    <th key={col} className={sortCol===col?'sorted':''} onClick={()=>sort(col)}>{lbl} {sortCol===col?(sortAsc?'↑':'↓'):'↕'}</th>
                  ))}
                  <th>Notes</th><th/>
                </tr>
              </thead>
              <tbody>
                {pageRows.length===0 ? <tr><td colSpan={11} className="empty">No results.</td></tr> : pageRows.map(r => (
                  <tr key={r._rowIndex}>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.stock_id}</td>
                    <td><strong>{r.cell_id}</strong></td>
                    <td><HostPill val={r._host}/></td>
                    <td style={{fontSize:11}}>{r.freezer_name}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{r.box_name}</td>
                    <td style={{fontFamily:'var(--mono)',textAlign:'right'}}>{r.num_tubes||'—'}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.concentration?Number(r.concentration).toLocaleString():'—'}</td>
                    <td style={{fontSize:11}}>{r.date_frozen}</td>
                    <td><SStatusPill val={r.status}/></td>
                    <td style={{color:'var(--muted)',fontSize:11}}>{r.label_notes}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => { setForm({...r}); setModal(parseInt(r._rowIndex)) }}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
                        </button>
                        <button className="icon-btn del" onClick={() => setDelTarget(r)}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pager">
            <span>{(page-1)*PS+1}–{Math.min(page*PS,filtered.length)} of {filtered.length}</span>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(i=>i===1||i===totalPages||Math.abs(i-page)<=1).map((i,idx,arr)=>(
              <>{idx>0&&arr[idx-1]<i-1&&<span key={`e${i}`}>…</span>}<button key={i} className={page===i?'cur':''} onClick={()=>setPage(i)}>{i}</button></>
            ))}
            <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>→</button>
          </div>
        )}

        {modal !== null && (
          <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div className="modal">
              <div className="modal-hdr">
                <h2>{modal==='add'?'Add stock entry':`Edit — ${form.stock_id}`}</h2>
                <button className="icon-btn" onClick={()=>setModal(null)}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
              </div>
              <div className="modal-body">
                {STOCK_FIELDS.map(f => (
                  <div key={f.id} className={`field${f.full?' full':''}`}>
                    <label>{f.label}</label>
                    {f.opts ? (
                      <select value={form[f.id]||''} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}>
                        <option value="">— select —</option>
                        {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type==='cellid' ? (
                      <select value={form[f.id]||''} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}>
                        <option value="">— select —</option>
                        {cellIds.map(id=><option key={id} value={id}>{id}</option>)}
                      </select>
                    ) : f.type==='date' ? (
                      <input type="date" value={form[f.id]||''} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}/>
                    ) : (
                      <input type="text" value={form[f.id]||''} onChange={e=>setForm(p=>({...p,[f.id]:e.target.value}))}/>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={()=>setModal(null)}>Cancel</button>
                <button className="btn primary" onClick={save} disabled={saving}>{saving?<span className="spinner"/>:'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {delTarget && (
          <div className="overlay" onClick={e=>e.target===e.currentTarget&&setDelTarget(null)}>
            <div className="modal" style={{maxWidth:340}}>
              <div className="modal-hdr"><h2>Delete row?</h2><button className="icon-btn" onClick={()=>setDelTarget(null)}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
              <div className="modal-body single">Permanently remove <strong>{delTarget.stock_id}</strong>? This cannot be undone.</div>
              <div className="modal-footer"><button className="btn" onClick={()=>setDelTarget(null)}>Cancel</button><button className="btn danger" onClick={confirmDelete}>Delete</button></div>
            </div>
          </div>
        )}

        {toast && <div className={`toast${toast.err?' err':''}`}>{toast.msg}</div>}
      </main>
    </div>
  )
}
