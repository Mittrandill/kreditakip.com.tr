"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="py-6 px-4 md:px-8 lg:px-16 relative z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo-white.svg" alt="KrediTakip" width={180} height={40} className="h-10 md:h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">
            Ana Sayfa
          </Link>
          <Link href="/fiyatlandirma" className="text-white/80 hover:text-white transition-colors">
            Fiyatlandırma
          </Link>
          <Link href="/hakkimizda" className="text-white/80 hover:text-white transition-colors">
            Hakkımızda
          </Link>
          <Link href="/iletisim" className="text-white/80 hover:text-white transition-colors">
            İletişim
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
            asChild
          >
            <Link href="/giris">Giriş Yap</Link>
          </Button>
          <Button className="bg-brand-green text-white font-semibold hover:bg-brand-green/90" size="lg" asChild>
            <Link href="/kayit-ol">Kayıt Ol</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-xl">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            <Link
              href="/fiyatlandirma"
              className="text-white/80 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fiyatlandırma
            </Link>
            <Link
              href="/hakkimizda"
              className="text-white/80 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hakkımızda
            </Link>
            <Link
              href="/iletisim"
              className="text-white/80 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              İletişim
            </Link>

            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="default"
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                asChild
              >
                <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                  Giriş Yap
                </Link>
              </Button>
              <Button
                className="w-full bg-brand-green text-white font-semibold hover:bg-brand-green/90"
                size="default"
                asChild
              >
                <Link href="/kayit-ol" onClick={() => setMobileMenuOpen(false)}>
                  Kayıt Ol
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
