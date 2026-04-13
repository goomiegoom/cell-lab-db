'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { HostPill, StatusPill } from '@/components/Pill'

interface CellDetail {
  cell: Record<string, string>
  stock: Record<string, string>[]
  log: Record<string, string>[]
  experiments: ExperimentGroup[]
}

interface ExperimentGroup {
  condition_id: string
  exp_id: string
  cell_id: string
  condition_type: string
  'seeding no': string
  MOI: string
  replicate: string
  Result: string
  notes: string
  experiment: Record<string, string>
  images: ImageRecord[]
}

interface ImageRecord {
  image_id: string
  condition_id: string
  day: string
  Confluence: string
  'CPE level': string
  image_url: string
  observation_notes: string
  fileId: string | null
}

export default function CellDetailPage() {
  const { cell_id } = useParams<{ cell_id: string }>()
  const router = useRouter()
  const [data, setData] = useState<CellDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<ImageRecord | null>(null)
  const [activeExp, setActiveExp] = useState<string | null>(null)

  useEffect(() => {
    if (!cell_id) return
    fetch(`/api/cell-detail/${encodeURIComponent(cell_id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        // Default to first experiment group
        if (d.experiments.length > 0) setActiveExp(d.experiments[0].condition_id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [cell_id])

  if (loading) return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="loading"><div className="spinner" /><span>Loading cell details…</span></div>
      </main>
    </div>
  )

  if (error || !data) return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div style={{ padding: 40, color: 'var(--danger)' }}>{error ?? 'Cell not found'}</div>
      </main>
    </div>
  )

  const { cell, stock, log, experiments } = data

  // Group experiments by exp_id for the tab bar
  const expGroups: Record<string, ExperimentGroup[]> = {}
  experiments.forEach(e => {
    if (!expGroups[e.exp_id]) expGroups[e.exp_id] = []
    expGroups[e.exp_id].push(e)
  })

  const activeGroup = experiments.find(e => e.condition_id === activeExp)

  return (
    <div className="app">
      <Sidebar />
      <main className="main">

        {/* Back nav */}
        <button
          onClick={() => router.push('/cells')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 13, marginBottom: 20, padding: 0 }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M10 3L5 8l5 5"/></svg>
          Back to Cells
        </button>

        {/* Cell header */}
        <div className="page-hdr" style={{ marginBottom: 24 }}>
          <div>
            <h1><em>{cell.cell_id}</em> — {cell.cell_name}</h1>
            <p style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <HostPill val={cell.host_species} />
              <StatusPill val={cell.status} />
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{cell.tissue_origin} · {cell.cell_type}</span>
            </p>
          </div>
        </div>

        {/* Cell info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Preferred media', value: cell.preferred_media },
            { label: 'Source', value: cell.source },
            { label: 'Culture notes', value: cell.culture_notes },
          ].filter(f => f.value).map(f => (
            <div key={f.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Stock table */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>
            Stock <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>({stock.length})</span>
          </h2>
          {stock.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No stock records.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Stock ID', 'Type', 'Freezer', 'Box', 'Tubes', 'Status', 'Notes'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => (
                    <tr key={s.stock_id}>
                      <td><strong>{s.stock_id}</strong></td>
                      <td>{s['stock type']}</td>
                      <td>{s.freezer_name}</td>
                      <td>{s.box_name}</td>
                      <td style={{ fontFamily: 'var(--mono)', textAlign: 'right' }}>{s.num_tubes || '—'}</td>
                      <td><StatusPill val={s.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.label_notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Status log */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>
            Status Log <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>({log.length})</span>
          </h2>
          {log.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No log entries.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Date', 'Action', 'Objective', 'Status', 'Notes'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {log.map(l => (
                    <tr key={l.status_id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{l.date}</td>
                      <td>{l.action}</td>
                      <td>{l.objective}</td>
                      <td><StatusPill val={l.experiment_status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{l.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Experiments & Images */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>
            Experiments <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}>({experiments.length} conditions)</span>
          </h2>

          {experiments.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No experiment records.</p>
          ) : (
            <>
              {/* Condition tabs */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {experiments.map(e => (
                  <button
                    key={e.condition_id}
                    onClick={() => setActiveExp(e.condition_id)}
                    style={{
                      padding: '5px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)',
                      background: activeExp === e.condition_id ? 'var(--accent)' : 'var(--surface)',
                      color: activeExp === e.condition_id ? '#fff' : 'var(--text-1)',
                      fontWeight: activeExp === e.condition_id ? 600 : 400,
                    }}
                  >
                    {e.condition_id} · {e.condition_type}
                  </button>
                ))}
              </div>

              {/* Active condition detail */}
              {activeGroup && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Condition meta */}
                  <div style={{ background: 'var(--surface)', padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experiment</span>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{activeGroup.exp_id}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{activeGroup.experiment.title} — {activeGroup.experiment.virus_name}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
                      <div style={{ fontSize: 13, marginTop: 2 }}>{activeGroup.condition_type}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seeding</span>
                      <div style={{ fontSize: 13, fontFamily: 'var(--mono)', marginTop: 2 }}>{activeGroup['seeding no'] || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MOI</span>
                      <div style={{ fontSize: 13, fontFamily: 'var(--mono)', marginTop: 2 }}>{activeGroup.MOI || '—'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</span>
                      <div style={{ fontSize: 13, marginTop: 2 }}>{activeGroup.Result || '—'}</div>
                    </div>
                    {activeGroup.notes && (
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</span>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{activeGroup.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Image gallery */}
                  <div style={{ padding: 18 }}>
                    {activeGroup.images.length === 0 ? (
                      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No images for this condition.</p>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                          {activeGroup.images.length} image{activeGroup.images.length !== 1 ? 's' : ''} · click to enlarge
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                          {activeGroup.images.map(img => (
                            <div
                              key={img.image_id}
                              onClick={() => img.fileId && setLightbox(img)}
                              style={{
                                border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
                                cursor: img.fileId ? 'pointer' : 'default',
                                background: 'var(--surface)',
                              }}
                            >
                              {img.fileId ? (
                                <img
                                  src={`/api/drive/${img.fileId}`}
                                  alt={img.image_id}
                                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                                  loading="lazy"
                                />
                              ) : (
                                <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 11 }}>
                                  Not found
                                </div>
                              )}
                              <div style={{ padding: '8px 10px' }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>Day {img.day}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{img.Confluence} · {img['CPE level']}</div>
                                {img.observation_notes && (
                                  <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 3 }}>{img.observation_notes}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Lightbox */}
        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '100%', background: 'var(--bg)', borderRadius: 12, overflow: 'hidden' }}>
              <img
                src={`/api/drive/${lightbox.fileId}`}
                alt={lightbox.image_id}
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#000' }}
              />
              <div style={{ padding: '14px 18px', display: 'flex', gap: 24, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{lightbox.image_id} · Day {lightbox.day}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                    Confluence: {lightbox.Confluence} · CPE: {lightbox['CPE level']}
                  </div>
                  {lightbox.observation_notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>{lightbox.observation_notes}</div>
                  )}
                </div>
                <button
                  onClick={() => setLightbox(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 4 }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
