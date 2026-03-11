import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Manrope } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant'
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono'
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-manrope'
})

export const metadata: Metadata = {
  title: 'Interior AI',
  description: 'AI Operating System for Interior Design Firms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmMono.variable} ${manrope.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}