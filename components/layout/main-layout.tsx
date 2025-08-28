"use client"

import { ReactNode } from "react"
import { Navbar } from "@/components/navigation/navbar"

interface MainLayoutProps {
  children: ReactNode
  showNavbar?: boolean
}

export function MainLayout({ 
  children, 
  showNavbar = true
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "" : "min-h-screen"}>
        {children}
      </main>
    </div>
  )
}