"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isLoggedIn, logout } = useAuth()
  const router = useRouter()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getUserInitials = () => {
    if (!user) return ''
    const firstName = user.firstName || user.first_name || ''
    const lastName = user.lastName || user.last_name || ''
    const firstInitial = firstName.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName.charAt(0)?.toUpperCase() || ''
    return firstInitial + lastInitial || user.email?.charAt(0)?.toUpperCase() || 'U'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hzPhiTcquwE6NDH7GuUV1CBffal9ao.png"
            alt="MAEGA logo"
            className="h-11 md:h-12 w-auto"
          />
        </Link>
        <nav className="hidden lg:flex items-center space-x-6">
          <Link href="/services" className="text-foreground hover:text-blue-600 transition-colors font-medium">
            Services
          </Link>
          <Link href="/about" className="text-foreground hover:text-blue-600 transition-colors font-medium">
            About
          </Link>
          <Link href="/portfolio" className="text-foreground hover:text-blue-600 transition-colors font-medium">
            Portfolio
          </Link>
          <Link href="/contact" className="text-foreground hover:text-blue-600 transition-colors font-medium">
            Contact
          </Link>
          <Link href="/join" className="text-foreground hover:text-blue-600 transition-colors font-medium">
            Join Now
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ) : (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>

        <div className="lg:hidden flex items-center space-x-2">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="flex items-center">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-500" />
              </button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-3 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all duration-300 ease-in-out"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div
                className={`absolute transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "rotate-45" : "rotate-0"}`}
              >
                <div
                  className={`w-6 h-0.5 bg-blue-600 transition-all duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                ></div>
              </div>
              <div
                className={`absolute transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "-rotate-45" : "rotate-0"}`}
              >
                <div
                  className={`w-6 h-0.5 bg-blue-600 transition-all duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                ></div>
              </div>
              <div
                className={`absolute transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
              >
                <div className="flex flex-col space-y-1">
                  <div className="w-6 h-0.5 bg-blue-600"></div>
                  <div className="w-6 h-0.5 bg-blue-600"></div>
                  <div className="w-6 h-0.5 bg-blue-600"></div>
                </div>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-xl animate-in slide-in-from-top-4 duration-300 ease-out">
          <nav className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-1">
              <Link
                href="/services"
                className="text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium py-3 px-4 rounded-xl touch-manipulation border-l-4 border-transparent hover:border-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/about"
                className="text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium py-3 px-4 rounded-xl touch-manipulation border-l-4 border-transparent hover:border-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/portfolio"
                className="text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium py-3 px-4 rounded-xl touch-manipulation border-l-4 border-transparent hover:border-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link
                href="/contact"
                className="text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium py-3 px-4 rounded-xl touch-manipulation border-l-4 border-transparent hover:border-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/join"
                className="text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium py-3 px-4 rounded-xl touch-manipulation border-l-4 border-transparent hover:border-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join Now
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
