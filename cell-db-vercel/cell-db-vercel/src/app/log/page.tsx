'use client'
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import { Pill } from '@/components/Pill'

export default function LogPage() {
  const [rows, setRows] = useState<any[]>([])
  const [cellIds, setCellIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [lRes, cRes] = await Promise.all([fetch('/api/log'), fetch('/api/cells')])
      const [log, cells] = await Promise.all([lRes.json(), cRes.json()])
      setRows([...log].sort((a, b) => (b.date||'').localeCompare(a.date||'')))
      setCellIds([...new Set<string>(cells.map((c: any) => c.cell_id).filter(Boolean))].sort())
    } catch { showToast('Failed to load', true) }
    setLoading(false)
  }

  function showToast(msg: string, err?: boolean) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setModal(false); setForm({}); showToast('Logged ✓'); load()
    } catch (e: any) { showToast(e.message, true) }
    setSaving(false)
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="page-hdr">
          <div><h1>Status <em>Log</em></h1><p>Cell actions, passages, and observations</p></div>
          <button className="btn primary" onClick={() => { setForm({ date: new Date().toISOString().split('T')[0] }); setModal(true) }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
            Log action
          </button>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-val">{rows.length}</div><div className="stat-lbl">Total entries</div></div>
          <div className="stat"><div className="stat-val">{rows.filter(r=>r.experiment_status==='Done').length}</div><div className="stat-lbl">Done</div></div>
          <div className="stat"><div className="stat-val">{new Set(rows.map(r=>r.cell_id).filter(Boolean)).size}</div><div className="stat-lbl">Cell lines logged</div></div>
        </div>

        <div className="table-wrap">
          {loading ? <div className="loading"><div className="spinner"/><span>Loading…</span></div> : (
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Cell</th><th>Stock ID</th><th>Action</th>
                  <th>Objective</th><th>Status</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="empty">No log entries yet.</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.date}</td>
                    <td><strong>{r.cell_id}</strong></td>
                    <td style={{fontFamily:'var(--mono)',fontSize:11}}>{r.stock_id}</td>
                    <td>{r.action}</td>
                    <td style={{color:'var(--muted)'}}>{r.objective}</td>
                    <td>
                      <Pill val={r.experiment_status} colorMap={{
                        Done:        ['#e6f5e0','#3a7830','#2a5822'],
                        'In progress':['#deeeff','#2860b8','#1a4888'],
                        Failed:      ['#fdd8d8','#a82828','#801818'],
                      }}/>
                    </td>
                    <td style={{color:'var(--muted)',fontSize:11}}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modal && (
          <div className="overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
            <div className="modal">
              <div className="modal-hdr">
                <h2>Log action</h2>
                <button className="icon-btn" onClick={()=>setModal(false)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="field">
                  <label>Cell ID</label>
                  <select value={form.cell_id||''} onChange={e=>setForm(p=>({...p,cell_id:e.target.value}))}>
                    <option value="">— select —</option>
                    {cellIds.map(id=><option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={form.date||''} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Action</label>
                  <input type="text" value={form.action||''} placeholder="e.g. T25 → T75" onChange={e=>setForm(p=>({...p,action:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Objective</label>
                  <input type="text" value={form.objective||''} onChange={e=>setForm(p=>({...p,objective:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={form.experiment_status||'Done'} onChange={e=>setForm(p=>({...p,experiment_status:e.target.value}))}>
                    <option>Done</option><option>In progress</option><option>Failed</option>
                  </select>
                </div>
                <div className="field full">
                  <label>Notes</label>
                  <textarea value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={()=>setModal(false)}>Cancel</button>
                <button className="btn primary" onClick={save} disabled={saving}>{saving?<span className="spinner"/>:'Log'}</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`toast${toast.err?' err':''}`}>{toast.msg}</div>}
      </main>
    </div>
  )
}
