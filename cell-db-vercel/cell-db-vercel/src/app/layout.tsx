import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cell Lab Database',
  description: 'RTU cryopreserved multi-species cell panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
