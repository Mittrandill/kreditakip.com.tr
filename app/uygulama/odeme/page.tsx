"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"

const CONTACT_PHONE = "+90 543 203 53 09"
const CONTACT_PHONE_CLEAN = "905432035309"

export default function PaymentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <Card className="w-full max-w-md bg-black/20 border-white/10 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-white text-2xl">Abonelik Satın Al</CardTitle>
          <p className="text-white/60 text-sm mt-2">
            Online ödeme sistemi şu an devre dışıdır. Abonelik satın almak için aşağıdaki numaradan bizimle iletişime geçin.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <a
            href={`tel:${CONTACT_PHONE_CLEAN}`}
            className="flex items-center justify-center gap-3 w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg py-4 transition-colors"
          >
            <Phone className="h-5 w-5" />
            <span className="text-lg font-semibold">{CONTACT_PHONE}</span>
          </a>
          <a
            href={`https://wa.me/${CONTACT_PHONE_CLEAN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg py-4 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-lg font-semibold">WhatsApp ile Yaz</span>
          </a>
          <p className="text-white/40 text-xs text-center">
            Telefon veya WhatsApp üzerinden ulaşarak aboneliğinizi kolayca başlatabilirsiniz.
          </p>
          <Link href="/uygulama/premium">
            <Button
              variant="outline"
              className="w-full bg-black/20 border-white/10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Planlara Dön
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
