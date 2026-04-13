'use client'
import { useEffect, useRef, useState } from 'react'
import { SP_C, STATUS_C, SSTAT_C } from './Pill'

const COLOR_MAPS: Record<string, Record<string, [string,string,string]>> = {
  host: SP_C, shost: SP_C, status: STATUS_C, sstatus: SSTAT_C,
}

interface Props {
  id: string
  label: string
  values: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  searchable?: boolean
}

export default function CheckboxFilter({ id, label, values, selected, onChange, searchable }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const cmap = COLOR_MAPS[id]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = q ? values.filter(v => v.toLowerCase().includes(q.toLowerCase())) : values

  function toggle(val: string) {
    const next = new Set(selected)
    next.has(val) ? next.delete(val) : next.add(val)
    onChange(next)
  }

  return (
    <div className="cb-filter" ref={ref}>
      <button
        className={`cb-trigger${selected.size > 0 ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        {label}
        {selected.size > 0 && <span className="cb-count">{selected.size}</span>}
        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </button>

      <div className={`cb-panel${open ? ' open' : ''}`}>
        <div className="cb-head">
          {label}
          <button onClick={() => { onChange(new Set()); setQ('') }}>Clear all</button>
        </div>
        {searchable && (
          <div className="cb-search">
            <input
              type="text"
              placeholder="Search…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        )}
        <div className="cb-list">
          {filtered.length === 0 && (
            <div style={{ padding: '12px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>No options</div>
          )}
          {filtered.map(v => {
            const c = cmap?.[v]
            return (
              <div key={v} className="cb-item" onClick={() => toggle(v)}>
                <input
                  type="checkbox"
                  checked={selected.has(v)}
                  onChange={() => toggle(v)}
                  onClick={e => e.stopPropagation()}
                />
                <span className="cb-label">
                  {c && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c[1], flexShrink: 0, display: 'inline-block' }} />}
                  <span>{v}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
