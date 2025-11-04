'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)

    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 text-6xl">⚠️</div>

        <h1 className="mb-4 text-3xl font-bold text-white">
          Bir Hata Oluştu
        </h1>

        <p className="mb-8 text-slate-400">
          Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-left text-sm text-red-400 font-mono">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-left text-xs text-red-500/70">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Tekrar Dene
          </Button>

          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-slate-600">
            Hata ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
