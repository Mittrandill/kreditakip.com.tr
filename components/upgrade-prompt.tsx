"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: "ocr" | "risk_analysis"
  usageInfo?: {
    used: number
    saved?: number // OCR ile kaydedilen kredi sayısı
    limit: number
  }
}

export function UpgradePrompt({ open, onOpenChange, feature, usageInfo }: UpgradePromptProps) {
  const router = useRouter()

  const featureNames = {
    ocr: "OCR Analizi",
    risk_analysis: "AI Finansal Sağlık Özeti",
  }

  const featureDescriptions = {
    ocr: "Kredi dökümlerinizi yapay zeka ile analiz edin",
    risk_analysis: "Finansal durumunuzu detaylı analiz edin",
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            {feature === "ocr" ? "Ücretsiz Kaydetme Hakkınız Doldu" : "Premium Özellik"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            {usageInfo && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature === "ocr" ? (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {usageInfo.saved}
                      </span> / {usageInfo.limit} kredi kaydedildi
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {usageInfo.used}
                      </span> / {usageInfo.limit} analiz yapıldı
                    </>
                  )}
                </p>
              </div>
            )}

            <p className="text-base">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{featureNames[feature]}</span> özelliğini
              kullanmak için Premium üyeliğe geçin.
            </p>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sınırsız OCR analizi</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">AI Finansal Sağlık Özeti</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Reklamsız deneyim</span>
              </div>
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Tüm özelliklere erişim</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                199₺<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/ay</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push("/uygulama/premium")
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Premium'a Geç
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full" size="lg">
            Daha Sonra
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
