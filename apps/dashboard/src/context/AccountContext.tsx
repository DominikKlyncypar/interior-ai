'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Account {
  id: string
  user_email: string
  provider: string
}

interface AccountContextType {
  accounts: Account[]
  activeAccount: string | null
  setActiveAccount: (email: string) => void
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  activeAccount: null,
  setActiveAccount: () => {}
})

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccount, setActiveAccount] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
        if (data.length > 0) {
          setActiveAccount(data[0].user_email)
        }
      }
    }
    fetchAccounts()
  }, [])

  return (
    <AccountContext.Provider value={{ accounts, activeAccount, setActiveAccount }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)