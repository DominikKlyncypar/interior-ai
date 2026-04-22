'use client'
import { AccountProvider } from '@/context/AccountContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      {children}
    </AccountProvider>
  )
}