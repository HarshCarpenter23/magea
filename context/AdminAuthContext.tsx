"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Admin {
  id: number
  username: string
  email: string
  firstName?: string
  lastName?: string
  role: string
}

interface AdminAuthContextType {
  admin: Admin | null
  isAdminLoggedIn: boolean
  adminLogin: (adminData: Admin) => void
  adminLogout: () => void
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing admin session on mount
    const storedAdmin = localStorage.getItem('admin')
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin)
        setAdmin(adminData)
        setIsAdminLoggedIn(true)
      } catch (error) {
        console.error('Error parsing stored admin data:', error)
        localStorage.removeItem('admin')
      }
    }
    setLoading(false)
  }, [])

  const adminLogin = (adminData: Admin) => {
    setAdmin(adminData)
    setIsAdminLoggedIn(true)
    localStorage.setItem('admin', JSON.stringify(adminData))
  }

  const adminLogout = () => {
    setAdmin(null)
    setIsAdminLoggedIn(false)
    localStorage.removeItem('admin')
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isAdminLoggedIn, adminLogin, adminLogout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
