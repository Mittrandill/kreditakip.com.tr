"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, TestTube, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react"
import BankLogo from "./bank-logo"

interface TestResult {
  bankName: string
  logoPath: string
  status: "success" | "error" | "loading"
  error?: string
}

export default function BankLogoTest() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTestingAll, setIsTestingAll] = useState(false)

  // Test edilecek banka listesi - VERİTABANINDAKİ TÜM BANKALAR
  const testBanks = [
    // Devlet Bankaları
    "T.C. Ziraat Bankası A.Ş.",
    "Türkiye Halk Bankası A.Ş.",
    "Türkiye Vakıflar Bankası T.A.O.",

    // Özel Sermayeli Bankalar
    "Akbank T.A.Ş.",
    "Türkiye Garanti Bankası A.Ş.",
    "Yapı ve Kredi Bankası A.Ş.",
    "QNB Finansbank A.Ş.",
    "Türkiye İş Bankası A.Ş.",
    "Türkiye Ekonomi Bankası A.Ş.",
    "Şekerbank T.A.Ş.",
    "Anadolubank A.Ş.",
    "Fibabanka A.Ş.",
    "Turkish Bank A.Ş.",
    "Adabank A.Ş.",

    // Yabancı Bankalar
    "DenizBank A.Ş.",
    "ING Bank A.Ş.",
    "HSBC Bank A.Ş.",
    "Citibank A.Ş.",
    "Deutsche Bank A.Ş.",
    "Alternatif Bank A.Ş.",
    "Burgan Bank A.Ş.",
    "ICBC Turkey Bank A.Ş.",
    "Odea Bank A.Ş.",
    "Rabobank A.Ş.",
    "MUFG Bank Turkey A.Ş.",
    "Intesa Sanpaolo S.p.A.",
    "Habib Bank Limited",
    "Standard Chartered Yatırım Bankası Türk A.Ş.",
    "Bank Mellat",
    "Arap Türk Bankası A.Ş.",
    "Turkland Bank A.Ş.",
    "Bank of China Turkey A.Ş.",

    // Katılım Bankaları
    "Ziraat Katılım Bankası A.Ş.",
    "Vakıf Katılım Bankası A.Ş.",
    "Türkiye Emlak Katılım Bankası A.Ş.",
    "Türkiye Finans Katılım Bankası A.Ş.",
    "Albaraka Türk Katılım Bankası A.Ş.",
    "Kuveyt Türk Katılım Bankası A.Ş.",
    "Hayat Finans Katılım Bankası A.Ş.",
    "Dünya Katılım Bankası A.Ş.",

    // Kalkınma ve Yatırım Bankaları
    "İller Bankası A.Ş.",
    "Türk Eximbank",
    "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
    "Türkiye Sınai Kalkınma Bankası A.Ş.",
    "Aktif Yatırım Bankası A.Ş.",
    "JPMorgan Chase Bank N.A.",
    "Société Générale (SA)",
    "Nurol Yatırım Bankası A.Ş.",
    "Pasha Yatırım Bankası A.Ş.",
    "BankPozitif Kredi ve Kalkınma Bankası A.Ş.",
    "Merrill Lynch Yatırım Bank A.Ş.",
    "Golden Global Yatırım Bankası A.Ş.",
    "GSD Yatırım Bankası A.Ş.",
    "İstanbul Takas ve Saklama Bankası A.Ş.",
    "Diler Yatırım Bankası A.Ş.",

    // Diğer
    "Enpara.com",
    "Colendi Bank A.Ş.",
    "Birleşik Fon Bankası A.Ş.",
    "Türk Ticaret Bankası A.Ş.",
  ]

  const testSingleBank = async (bankName: string): Promise<TestResult> => {
    return new Promise((resolve) => {
      const img = new Image()
      const logoPath = getBankLogoPath(bankName)

      const timeoutId = setTimeout(() => {
        resolve({
          bankName,
          logoPath,
          status: "error",
          error: "Timeout - 5 saniye içinde yüklenemedi",
        })
      }, 5000)

      img.onload = () => {
        clearTimeout(timeoutId)
        resolve({
          bankName,
          logoPath,
          status: "success",
        })
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        resolve({
          bankName,
          logoPath,
          status: "error",
          error: "Dosya bulunamadı veya yüklenemedi",
        })
      }

      img.src = logoPath
    })
  }

  // Logo yolu alma fonksiyonu (BankLogo component'indeki ile aynı)
  const getBankLogoPath = (bankName: string): string => {
    const bankMappings: Record<string, string> = {
      "T.C. Ziraat Bankası A.Ş.": "/bank-icons/ziraat-bankasi.png",
      "Türkiye Halk Bankası A.Ş.": "/bank-icons/turkiye-halk-bankasi.png",
      "Türkiye Vakıflar Bankası T.A.O.": "/bank-icons/turkiye-vakiflar-bankasi.png",
      "Akbank T.A.Ş.": "/bank-icons/akbank.png",
      "Türkiye Garanti Bankası A.Ş.": "/bank-icons/turkiye-garanti-bankasi.png",
      "Yapı ve Kredi Bankası A.Ş.": "/bank-icons/yapi-ve-kredi-bankasi.png",
      "QNB Finansbank A.Ş.": "/bank-icons/qnb-finansbank.png",
      "Türkiye İş Bankası A.Ş.": "/bank-icons/turkiye-is-bankasi.png",
      "Türkiye Ekonomi Bankası A.Ş.": "/bank-icons/turkiye-ekonomi-bankasi.png",
      "Şekerbank T.A.Ş.": "/bank-icons/sekerbank.png",
      "ING Bank A.Ş.": "/bank-icons/ing-bank.png",
      "DenizBank A.Ş.": "/bank-icons/denizbank.png",
      "HSBC Bank A.Ş.": "/bank-icons/hsbc-bank.png",
      "Citibank A.Ş.": "/bank-icons/citibank.png",
      "Deutsche Bank A.Ş.": "/bank-icons/deutsche-bank.png",
      "Ziraat Katılım Bankası A.Ş.": "/bank-icons/ziraat-katilim-bankasi.png",
      "Vakıf Katılım Bankası A.Ş.": "/bank-icons/vakif-katilim-bankasi.png",
      "Türkiye Emlak Katılım Bankası A.Ş.": "/bank-icons/turkiye-emlak-katilim-bankasi.png",
      "Kuveyt Türk Katılım Bankası A.Ş.": "/bank-icons/kuveyt-turk-katilim-bankasi.png",
      "Albaraka Türk Katılım Bankası A.Ş.": "/bank-icons/albaraka-turk-katilim-bankasi.png",
      "Türkiye Finans Katılım Bankası A.Ş.": "/bank-icons/turkiye-finans-katilim-bankasi.png",
      "Anadolubank A.Ş.": "/bank-icons/anadolubank.png",
      "Fibabanka A.Ş.": "/bank-icons/fibabanka.png",
      "Turkish Bank A.Ş.": "/bank-icons/turkish-bank.png",
      "Adabank A.Ş.": "/bank-icons/adabank.png",
      "Alternatif Bank A.Ş.": "/bank-icons/alternatif-bank.png",
      "Burgan Bank A.Ş.": "/bank-icons/burgan-bank.png",
      "ICBC Turkey Bank A.Ş.": "/bank-icons/icbc-turkey-bank.png",
      "Odea Bank A.Ş.": "/bank-icons/odeabank.png",
      "İller Bankası A.Ş.": "/bank-icons/iller-bankasi.png",
      "Türk Eximbank": "/bank-icons/turk-eximbank.png",
      "Türkiye Kalkınma ve Yatırım Bankası A.Ş.": "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
      "Türkiye Sınai Kalkınma Bankası A.Ş.": "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
      "Aktif Yatırım Bankası A.Ş.": "/bank-icons/aktif-yatirim-bankasi.png",
      "JPMorgan Chase Bank N.A.": "/bank-icons/jpmorgan-chase-bank.png",
      "Société Générale (SA)": "/bank-icons/societe-generale.png",
      "Nurol Yatırım Bankası A.Ş.": "/bank-icons/nurol-yatirim-bankasi.png",
      "Pasha Yatırım Bankası A.Ş.": "/bank-icons/pasha-yatirim-bankasi.png",
      "BankPozitif Kredi ve Kalkınma Bankası A.Ş.": "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",
      "Merrill Lynch Yatırım Bank A.Ş.": "/bank-icons/merrill-lynch-yatirim-bank.png",
      "Golden Global Yatırım Bankası A.Ş.": "/bank-icons/golden-global-yatirim-bankasi.png",
      "GSD Yatırım Bankası A.Ş.": "/bank-icons/gsd-yatirim-bankasi.png",
      "İstanbul Takas ve Saklama Bankası A.Ş.": "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
      "Diler Yatırım Bankası A.Ş.": "/bank-icons/diler-yatirim-bankasi.png",
      "Intesa Sanpaolo S.p.A.": "/bank-icons/intesa-sanpaolo.png",
      "Habib Bank Limited": "/bank-icons/habib-bank-limited.png",
      "Standard Chartered Yatırım Bankası Türk A.Ş.": "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",
      "Bank Mellat": "/bank-icons/bank-mellat.png",
      "Rabobank A.Ş.": "/bank-icons/rabobank.png",
      "MUFG Bank Turkey A.Ş.": "/bank-icons/mufg-bank-turkey.png",
      "Hayat Finans Katılım Bankası A.Ş.": "/bank-icons/hayat-finans-katilim-bankasi.png",
      "Dünya Katılım Bankası A.Ş.": "/bank-icons/dunya-katilim-bankasi.png",
      "Enpara.com": "/bank-icons/enpara-bank.png",
      "Colendi Bank A.Ş.": "/bank-icons/colendi-bank.png",
      "Birleşik Fon Bankası A.Ş.": "/bank-icons/birlesik-fon-bankasi.png",
      "Türk Ticaret Bankası A.Ş.": "/bank-icons/turk-ticaret-bankasi.png",
      "Arap Türk Bankası A.Ş.": "/bank-icons/arap-turk-bankasi.png",
      "Turkland Bank A.Ş.": "/bank-icons/turkland-bank.png",
      "Bank of China Turkey A.Ş.": "/bank-icons/bank-of-china-turkey.png",
    }

    return bankMappings[bankName] || "/bank-icons/default-bank.png"
  }

  const testAllBanks = async () => {
    setIsTestingAll(true)
    setTestResults([])

    // İlk olarak loading state'leri ekle
    const loadingResults = testBanks.map((bankName) => ({
      bankName,
      logoPath: getBankLogoPath(bankName),
      status: "loading" as const,
    }))
    setTestResults(loadingResults)

    // Her bankayı sırayla test et
    for (let i = 0; i < testBanks.length; i++) {
      const result = await testSingleBank(testBanks[i])
      setTestResults((prev) => prev.map((item, index) => (index === i ? result : item)))
    }

    setIsTestingAll(false)
  }

  const copyFailedBanks = () => {
    const failedBanks = testResults
      .filter((r) => r.status === "error")
      .map((r) => `"${r.bankName}": "${r.logoPath}"`)
      .join(",\n")

    navigator.clipboard.writeText(failedBanks)
    alert("Başarısız bankalar panoya kopyalandı!")
  }

  const successCount = testResults.filter((r) => r.status === "success").length
  const errorCount = testResults.filter((r) => r.status === "error").length
  const loadingCount = testResults.filter((r) => r.status === "loading").length

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <TestTube className="h-4 w-4 mr-2" />🧪 Logo Test ({testBanks.length} Banka)
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Süper Logo Test Merkezi ({testBanks.length} Banka)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Tüm {testBanks.length} banka logosunu test et</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Kontrolleri */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={testAllBanks} disabled={isTestingAll} className="bg-emerald-600 hover:bg-emerald-700">
                {isTestingAll ? "Test Ediliyor..." : `Tüm ${testBanks.length} Bankayı Test Et`}
              </Button>
              <Button variant="outline" onClick={() => setTestResults([])} disabled={isTestingAll}>
                Temizle
              </Button>
              {errorCount > 0 && (
                <Button variant="outline" onClick={copyFailedBanks} size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Hataları Kopyala
                </Button>
              )}
            </div>

            {testResults.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {successCount} Başarılı
                </Badge>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount} Hata
                </Badge>
                {loadingCount > 0 && (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {loadingCount} Yükleniyor
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Test Sonuçları */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  result.status === "success"
                    ? "bg-green-50 border-green-200"
                    : result.status === "error"
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex-shrink-0">
                  {result.status === "loading" ? (
                    <div className="w-8 h-8 rounded bg-gray-200 animate-pulse" />
                  ) : (
                    <BankLogo bankName={result.bankName} size="sm" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{result.bankName}</p>
                  <p className="text-xs text-gray-500 truncate">{result.logoPath}</p>
                  {result.error && <p className="text-xs text-red-600">{result.error}</p>}
                </div>

                <div className="flex-shrink-0">
                  {result.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {result.status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                  {result.status === "loading" && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {testResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Test başlatmak için "Tüm {testBanks.length} Bankayı Test Et" butonuna tıklayın</p>
              <p className="text-sm mt-2">Bu test tüm veritabanındaki bankaları kontrol eder</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
