'use client'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import CheckboxFilter from '@/components/CheckboxFilter'
import { HostPill, StatusPill } from '@/components/Pill'

const PS = 25

const CELL_FIELDS = [
  { id: 'cell_id',        label: 'Cell ID' },
  { id: 'cell_name',      label: 'Cell name' },
  { id: 'host_species',   label: 'Host species',  type: 'host' },
  { id: 'tissue_origin',  label: 'Tissue / organ' },
  { id: 'cell_type',      label: 'Cell type',     opts: ['Cell line','organoids','primary culture','Virus'] },
  { id: 'status',         label: 'Status',        opts: ['Include in final plate','Include in final plate , Re-plate','Include in final plate , need more stock','Poor growth','Poor growth in plate','Not yet/Fail to stock','Virus'] },
  { id: 'preferred_media',label: 'Preferred media' },
  { id: 'source',         label: 'Source' },
  { id: 'culture_notes',  label: 'Culture notes', full: true, textarea: true },
]

export default function CellsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selHost,   setSelHost]   = useState<Set<string>>(new Set())
  const [selStatus, setSelStatus] = useState<Set<string>>(new Set())
  const [selType,   setSelType]   = useState<Set<string>>(new Set())
  const [sortCol, setSortCol] = useState('cell_id')
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
      const res = await fetch('/api/cells')
      setRows(await res.json())
    } catch { showToast('Failed to load', true) }
    setLoading(false)
  }

  function showToast(msg: string, err?: boolean) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  // Derived filter options
  const hosts   = useMemo(() => Array.from(new Set(rows.map(r => r.host_species).filter(Boolean))).sort(), [rows])
  const statuses = useMemo(() => Array.from(new Set(rows.map(r => r.status).filter(Boolean))).sort(), [rows])
  const types   = useMemo(() => Array.from(new Set(rows.map(r => r.cell_type).filter(Boolean))).sort(), [rows])

  const filtered = useMemo(() => {
    let r = rows.filter(row => {
      const q = search.toLowerCase()
      if (q && !['cell_id','host_species','tissue_origin','culture_notes'].some(k => (row[k]||'').toLowerCase().includes(q))) return false
      if (selHost.size   && !selHost.has(row.host_species)) return false
      if (selStatus.size && !selStatus.has(row.status))     return false
      if (selType.size   && !selType.has(row.cell_type))    return false
      return true
    })
    r = r.sort((a, b) => {
      const av = (a[sortCol]||'').toString(), bv = (b[sortCol]||'').toString()
      const n = parseFloat(av) - parseFloat(bv)
      const cmp = isNaN(n) ? av.localeCompare(bv) : n
      return sortAsc ? cmp : -cmp
    })
    return r
  }, [rows, search, selHost, selStatus, selType, sortCol, sortAsc])

  function sort(col: string) {
    setSortAsc(sortCol === col ? !sortAsc : true)
    setSortCol(col)
    setPage(1)
  }

  const pageRows = filtered.slice((page-1)*PS, page*PS)
  const totalPages = Math.ceil(filtered.length / PS)

  // Remove tag
  function removeTag(key: string, val: string) {
    if (key === 'host')   setSelHost(s   => { const n=new Set(s); n.delete(val); return n })
    if (key === 'status') setSelStatus(s => { const n=new Set(s); n.delete(val); return n })
    if (key === 'type')   setSelType(s   => { const n=new Set(s); n.delete(val); return n })
  }

  function openAdd() { setForm({}); setModal('add') }
  function openEdit(row: any) { setForm({ ...row }); setModal(parseInt(row._rowIndex)) }

  async function save() {
    setSaving(true)
    try {
      const isEdit = typeof modal === 'number'
      const res = await fetch(isEdit ? `/api/cells/${modal}` : '/api/cells', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setModal(null)
      showToast('Saved ✓')
      load()
    } catch (e: any) { showToast(e.message, true) }
    setSaving(false)
  }

  async function confirmDelete() {
    if (!delTarget) return
    try {
      const res = await fetch(`/api/cells/${delTarget._rowIndex}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDelTarget(null)
      showToast('Deleted')
      load()
    } catch (e: any) { showToast(e.message, true) }
  }

  // All active tags
  const activeTags: { key: string; val: string }[] = [
    ...Array.from(selHost).map(v   => ({ key: 'host',   val: v })),
    ...Array.from(selStatus).map(v => ({ key: 'status', val: v })),
    ...Array.from(selType).map(v   => ({ key: 'type',   val: v })),
  ]

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="page-hdr">
          <div>
            <h1>All <em>Cells</em></h1>
            <p>{rows.length} records · {new Set(rows.map(r=>r.host_species).filter(Boolean)).size} host species</p>
          </div>
          <button className="btn primary" onClick={openAdd}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
            Add cell
          </button>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat"><div className="stat-val">{rows.length}</div><div className="stat-lbl">Total</div></div>
          <div className="stat"><div className="stat-val">{new Set(rows.map(r=>r.host_species).filter(Boolean)).size}</div><div className="stat-lbl">Host species</div></div>
          <div className="stat"><div className="stat-val">{rows.filter(r=>r.status?.startsWith('Include')).length}</div><div className="stat-lbl">In final plate</div></div>
          <div className="stat"><div className="stat-val">{rows.filter(r=>r.status?.startsWith('Poor')).length}</div><div className="stat-lbl">Poor growth</div></div>
          <div className="stat"><div className="stat-val">{filtered.length}</div><div className="stat-lbl">Showing</div></div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3 3"/></svg>
            <input placeholder="Search name, host, tissue, notes…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <CheckboxFilter id="host"   label="Host"   values={hosts}    selected={selHost}   onChange={s => { setSelHost(s);   setPage(1) }} searchable />
          <CheckboxFilter id="status" label="Status" values={statuses}  selected={selStatus} onChange={s => { setSelStatus(s); setPage(1) }} searchable />
          <CheckboxFilter id="type"   label="Type"   values={types}     selected={selType}   onChange={s => { setSelType(s);   setPage(1) }} />
        </div>

        {/* Active filter tags */}
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

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div className="loading"><div className="spinner"/><span>Loading…</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  {[['cell_id','ID'],['host_species','Host'],['tissue_origin','Tissue'],['cell_type','Type'],['status','Status'],['preferred_media','Media'],['source','Source'],['_total_tubes','Tubes']].map(([col,lbl]) => (
                    <th key={col} className={sortCol===col?'sorted':''} onClick={() => sort(col)}>{lbl} {sortCol===col ? (sortAsc?'↑':'↓') : '↕'}</th>
                  ))}
                  <th/>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={9} className="empty">No cells match your filters.</td></tr>
                ) : pageRows.map(r => (
                  <tr key={r._rowIndex}>
                    <td><strong>{r.cell_id}</strong></td>
                    <td><HostPill val={r.host_species}/></td>
                    <td>{r.tissue_origin}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.cell_type}</td>
                    <td><StatusPill val={r.status}/></td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.preferred_media}</td>
                    <td>{r.source}</td>
                    <td style={{fontFamily:'var(--mono)',textAlign:'right'}}>{r._total_tubes ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(r)}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
                        </button>
                        <button className="icon-btn del" title="Delete" onClick={() => setDelTarget(r)}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pager">
            <span>{(page-1)*PS+1}–{Math.min(page*PS,filtered.length)} of {filtered.length}</span>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}>←</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(i=>i===1||i===totalPages||Math.abs(i-page)<=1).map((i,idx,arr) => (
              <>
                {idx>0 && arr[idx-1]<i-1 && <span key={`e${i}`}>…</span>}
                <button key={i} className={page===i?'cur':''} onClick={()=>setPage(i)}>{i}</button>
              </>
            ))}
            <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>→</button>
          </div>
        )}

        {/* Add/Edit modal */}
        {modal !== null && (
          <div className="overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
            <div className="modal">
              <div className="modal-hdr">
                <h2>{modal === 'add' ? 'Add cell' : `Edit — ${form.cell_id}`}</h2>
                <button className="icon-btn" onClick={() => setModal(null)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                </button>
              </div>
              <div className="modal-body">
                {CELL_FIELDS.map(f => (
                  <div key={f.id} className={`field${f.full ? ' full' : ''}`}>
                    <label>{f.label}</label>
                    {f.opts ? (
                      <select value={form[f.id]||''} onChange={e => setForm(p => ({...p,[f.id]:e.target.value}))}>
                        <option value="">— select —</option>
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'host' ? (
                      <select value={form[f.id]||''} onChange={e => setForm(p => ({...p,[f.id]:e.target.value}))}>
                        <option value="">— select —</option>
                        {hosts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.textarea ? (
                      <textarea value={form[f.id]||''} onChange={e => setForm(p => ({...p,[f.id]:e.target.value}))}/>
                    ) : (
                      <input type="text" value={form[f.id]||''} onChange={e => setForm(p => ({...p,[f.id]:e.target.value}))}/>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn primary" onClick={save} disabled={saving}>
                  {saving ? <span className="spinner"/> : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {delTarget && (
          <div className="overlay" onClick={e => e.target===e.currentTarget && setDelTarget(null)}>
            <div className="modal" style={{maxWidth:340}}>
              <div className="modal-hdr">
                <h2>Delete row?</h2>
                <button className="icon-btn" onClick={() => setDelTarget(null)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                </button>
              </div>
              <div className="modal-body single">Permanently remove <strong>{delTarget.cell_id}</strong>? This cannot be undone.</div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setDelTarget(null)}>Cancel</button>
                <button className="btn danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`toast${toast.err?' err':''}`}>{toast.msg}</div>}
      </main>
    </div>
  )
}
