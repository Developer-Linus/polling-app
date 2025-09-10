"use client"

import { ReactNode } from "react"
import { Navbar } from "@/components/navigation/navbar"
import { MainLayoutProps } from "@/lib/types"

export function MainLayout({ 
  children, 
  showNavbar = true
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "" : "min-h-screen"}>
        {children}
      </main>
    </div>
  )
}