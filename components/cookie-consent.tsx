'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Link from 'next/link'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }))
    setShowBanner(false)

    // TODO: Initialize analytics and other services here
    // initializeAnalytics()
  }

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black/95 to-black/90 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🍪 Çerez Bildirimi
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Web sitemizde sizlere daha iyi hizmet sunabilmek için çerezler kullanıyoruz.
              Detaylı bilgi için{' '}
              <Link
                href="/cerez-politikasi"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                çerez politikamızı
              </Link>
              {' '}ve{' '}
              <Link
                href="/gizlilik-politikasi"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                gizlilik politikamızı
              </Link>
              {' '}inceleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
            >
              Sadece Gerekli Çerezler
            </Button>
            <Button
              onClick={acceptAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Tümünü Kabul Et
            </Button>
          </div>

          <button
            onClick={acceptNecessary}
            className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 text-slate-400 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
