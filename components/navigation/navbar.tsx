"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { LogoutButton } from "@/components/auth/logout-button"
import { 
  BarChart3, 
  Plus, 
  Menu, 
  X, 
  Home,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NavItem } from "@/lib/types"

/**
 * Navigation configuration for authenticated users
 * Centralized to enable easy addition/removal of navigation items
 */
const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home
  },
  {
    label: "Create Poll",
    href: "/polls/create",
    icon: Plus
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3
  }
]

/**
 * Brand logo component with consistent styling
 * Extracted for reusability and easier brand updates
 */
function BrandLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <BarChart3 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900">PollApp</span>
    </Link>
  )
}

/**
 * Navigation link component for consistent styling across desktop and mobile
 * @param item - Navigation item configuration
 * @param isActive - Whether the current route matches this item
 * @param isMobile - Whether to use mobile-specific styling
 * @param onClick - Optional click handler for mobile menu closure
 */
interface NavigationLinkProps {
  item: NavItem
  isActive: boolean
  isMobile?: boolean
  onClick?: () => void
}

function NavigationLink({ item, isActive, isMobile = false, onClick }: NavigationLinkProps) {
  const Icon = item.icon
  const baseClasses = "flex items-center rounded-md font-medium transition-colors"
  const sizeClasses = isMobile 
    ? "space-x-3 px-3 py-2 text-base" 
    : "space-x-2 px-3 py-2 text-sm"
  const stateClasses = isActive
    ? "bg-blue-100 text-blue-700"
    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  
  return (
    <Link
      href={item.href}
      className={cn(baseClasses, sizeClasses, stateClasses)}
      onClick={onClick}
    >
      <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      <span>{item.label}</span>
    </Link>
  )
}

/**
 * Authentication buttons for unauthenticated users
 * Extracted to reduce component complexity and improve reusability
 */
function AuthButtons() {
  return (
    <div className="flex items-center space-x-2">
      <Button asChild variant="ghost" size="sm" className="flex items-center space-x-2">
        <Link href="/auth/login">
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Link>
      </Button>
      <Button asChild size="sm" className="flex items-center space-x-2">
        <Link href="/auth/register">
          <UserPlus className="h-4 w-4" />
          <span>Sign Up</span>
        </Link>
      </Button>
    </div>
  )
}

/**
 * Mobile menu toggle button
 * Extracted for cleaner component structure
 */
interface MobileMenuToggleProps {
  isOpen: boolean
  onToggle: () => void
}

function MobileMenuToggle({ isOpen, onToggle }: MobileMenuToggleProps) {
  return (
    <button
      className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      onClick={onToggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )
}

/**
 * Mobile navigation menu content
 * Separated to improve readability and maintainability
 */
interface MobileMenuProps {
  isAuthenticated: boolean
  navigationItems: NavItem[]
  isActive: (href: string) => boolean
  onClose: () => void
}

function MobileMenu({ isAuthenticated, navigationItems, isActive, onClose }: MobileMenuProps) {
  return (
    <div className="md:hidden border-t border-gray-200 bg-white">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {isAuthenticated ? (
          <>
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                isMobile
                onClick={onClose}
              />
            ))}
            <LogoutButton 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full"
              onClick={onClose}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </LogoutButton>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onClose}
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onClose}
            >
              <UserPlus className="h-5 w-5" />
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Main navigation component for the polling application
 * 
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Authentication-aware navigation items
 * - Active route highlighting
 * - Consistent styling across desktop and mobile
 * 
 * Architecture:
 * - Modular sub-components for maintainability
 * - Centralized navigation configuration
 * - Reusable styling patterns
 */
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname()

  /**
   * Determines if a navigation item should be highlighted as active
   * Special handling for dashboard to prevent false positives on sub-routes
   */
  const isActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  // Close mobile menu when route changes or user clicks outside
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <BrandLogo />
          </div>

          {/* Desktop Navigation - Only visible for authenticated users */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <LogoutButton 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </LogoutButton>
            ) : (
              <AuthButtons />
            )}

            {/* Mobile Menu Toggle */}
            <MobileMenuToggle 
              isOpen={isMobileMenuOpen} 
              onToggle={toggleMobileMenu} 
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <MobileMenu
          isAuthenticated={isAuthenticated}
          navigationItems={navigationItems}
          isActive={isActive}
          onClose={closeMobileMenu}
        />
      )}
    </nav>
  )
}