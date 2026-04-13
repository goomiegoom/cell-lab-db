import { readSheet, SHEETS } from '@/lib/sheets'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export const revalidate = 60

export default async function HomePage() {
  let cellCount = 0, stockCount = 0, logCount = 0
  try {
    const [cells, stock, log] = await Promise.all([
      readSheet(SHEETS.CELLS),
      readSheet(SHEETS.STOCK),
      readSheet(SHEETS.LOG),
    ])
    cellCount = cells.length
    stockCount = stock.length
    logCount = log.length
  } catch {}

  const cards = [
    { href: '/cells',  icon: '🔬', title: 'All Cells',   desc: 'Master cell registry',    count: cellCount },
    { href: '/stock',  icon: '🧊', title: 'Cell Stock',  desc: 'Physical tube inventory', count: stockCount },
    { href: '/log',    icon: '📋', title: 'Status Log',  desc: 'Passage & action history',count: logCount },
  ]

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="page-hdr">
          <div>
            <h1>Cell Lab <em>Database</em></h1>
            <p>RTU cryopreserved multi-species cell panel · PhD thesis</p>
          </div>
        </div>
        <div className="home-grid">
          {cards.map(c => (
            <Link key={c.href} href={c.href} className="home-card">
              <div className="hc-icon">{c.icon}</div>
              <div className="hc-title">{c.title}</div>
              <div className="hc-desc">{c.desc}</div>
              <div className="hc-count">{c.count}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
