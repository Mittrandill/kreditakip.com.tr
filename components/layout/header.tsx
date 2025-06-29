"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: "Nasıl Çalışır", href: "/#nasil-calisir" },
    { name: "Özellikler", href: "/ozellikler" },
    { name: "Fiyatlandırma", href: "/fiyatlandirma" },
    { name: "Şirket", href: "/hakkimizda" },
  ]

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/images/logo-white.svg" alt="KrediTakip" width={180} height={40} className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-emerald-400"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => router.push("/giris")}
          >
            Giriş Yap
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg border-0"
            onClick={() => router.push("/giris")}
          >
            Ücretsiz Başla
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-300 hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-sm font-medium text-gray-300 hover:text-emerald-400"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:bg-white/10"
                onClick={() => {
                  router.push("/giris")
                  setIsMenuOpen(false)
                }}
              >
                Giriş Yap
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
