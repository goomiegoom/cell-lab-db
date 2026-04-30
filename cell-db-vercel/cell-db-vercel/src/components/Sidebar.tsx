'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/', label: 'Home', icon: <path d="M2 6.5L8 2l6 4.5V14H2V6.5z"/> },
  { href: '/cells',  label: 'All Cells',  icon: <><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/></> },
  { href: '/stock',  label: 'Cell Stock', icon: <><rect x="2" y="4" width="12" height="10" rx="2"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/></> },
  { href: '/log',    label: 'Status Log', icon: <path d="M3 4h10M3 8h7M3 12h5"/> },
]

export default function Sidebar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [path])

  return (
    <>
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
            <path d="M2 4h12M2 8h12M2 12h12"/>
          </svg>
        </button>
        <span className="mobile-header-title">Cell Lab DB</span>
      </div>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <nav className={`sidebar${open ? ' open' : ''}`}>
        <div className="logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>Cell Lab DB</h2>
            <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                <path d="M4 4l8 8M12 4l-8 8"/>
              </svg>
            </button>
          </div>
          <p>RTU Panel Project</p>
        </div>
        <div className="nav-section">Overview</div>
        {NAV.slice(0,1).map(n => (
          <Link key={n.href} href={n.href} className={`nav-item${path === n.href ? ' active' : ''}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{n.icon}</svg>
            {n.label}
          </Link>
        ))}
        <div className="nav-section">Lab inventory</div>
        {NAV.slice(1).map(n => (
          <Link key={n.href} href={n.href} className={`nav-item${path === n.href ? ' active' : ''}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{n.icon}</svg>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
