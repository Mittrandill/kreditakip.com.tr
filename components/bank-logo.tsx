"use client"

import { Building2 } from "lucide-react"
import { useState, useEffect } from "react"

interface BankLogoProps {
  bankName: string
  logoUrl?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

// Banka adlarına göre benzersiz renkler (fallback için)
const getBankColor = (bankName: string): string => {
  const colors = [
    "bg-gradient-to-br from-emerald-500 to-emerald-600",
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
    "bg-gradient-to-br from-rose-500 to-rose-600",
    "bg-gradient-to-br from-green-600 to-green-700",
    "bg-gradient-to-br from-sky-500 to-sky-600",
    "bg-gradient-to-br from-yellow-500 to-yellow-600",
    "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
  ]

  let hash = 0
  for (let i = 0; i < bankName.length; i++) {
    const char = bankName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return colors[Math.abs(hash) % colors.length]
}

const getSizeClasses = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "h-8 w-8"
    case "md":
      return "h-12 w-12"
    case "lg":
      return "h-16 w-16"
    default:
      return "h-12 w-12"
  }
}

const getIconSize = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "h-4 w-4"
    case "md":
      return "h-6 w-6"
    case "lg":
      return "h-8 w-8"
    default:
      return "h-6 w-6"
  }
}

// SÜPER KAPSAMLI BANKA LOGO EŞLEŞTİRMESİ - FALLBACK İÇİN
const getBankLogoPath = (bankName: string): string => {
  const bankMappings: Record<string, string> = {
    // Yapı Kredi variations
    "Yapı Kredi": "/bank-icons/yapi-kredi.png",
    "Yapı Kredi Bankası": "/bank-icons/yapi-kredi.png",
    "Yapı ve Kredi Bankası A.Ş.": "/bank-icons/yapi-kredi.png",
    "Yapı ve Kredi": "/bank-icons/yapi-kredi.png",
    YapıKredi: "/bank-icons/yapi-kredi.png",

    // Garanti variations
    Garanti: "/bank-icons/garanti.png",
    "Garanti BBVA": "/bank-icons/garanti.png",
    "Türkiye Garanti Bankası": "/bank-icons/garanti.png",
    "Türkiye Garanti Bankası A.Ş.": "/bank-icons/garanti.png",
    "Garanti Bankası": "/bank-icons/garanti.png",

    // Akbank variations
    Akbank: "/bank-icons/akbank.png",
    "Akbank T.A.Ş.": "/bank-icons/akbank.png",

    // İş Bankası variations
    "İş Bankası": "/bank-icons/is-bankasi.png",
    "Türkiye İş Bankası": "/bank-icons/is-bankasi.png",
    "Türkiye İş Bankası A.Ş.": "/bank-icons/is-bankasi.png",
    İşbank: "/bank-icons/is-bankasi.png",

    // Ziraat Bankası variations
    "Ziraat Bankası": "/bank-icons/ziraat.png",
    "T.C. Ziraat Bankası A.Ş.": "/bank-icons/ziraat.png",
    "TC Ziraat Bankası": "/bank-icons/ziraat.png",
    Ziraat: "/bank-icons/ziraat.png",

    // VakıfBank variations
    VakıfBank: "/bank-icons/vakifbank.png",
    "Türkiye Vakıflar Bankası": "/bank-icons/vakifbank.png",
    "Türkiye Vakıflar Bankası T.A.O.": "/bank-icons/vakifbank.png",
    "Vakıflar Bankası": "/bank-icons/vakifbank.png",
    "Vakıf Bankası": "/bank-icons/vakifbank.png",

    // Halkbank variations
    Halkbank: "/bank-icons/halkbank.png",
    "Türkiye Halk Bankası A.Ş.": "/bank-icons/halkbank.png",
    "Halk Bankası": "/bank-icons/halkbank.png",
    "T. Halk Bankası A.Ş.": "/bank-icons/halkbank.png",

    // DenizBank variations
    DenizBank: "/bank-icons/denizbank.png",
    "DenizBank A.Ş.": "/bank-icons/denizbank.png",
    Denizbank: "/bank-icons/denizbank.png",

    // Enpara Bank variations
    "Enpara Bank": "/bank-icons/enpara.png",
    "Enpara Bank A.Ş.": "/bank-icons/enpara.png",
    "Enpara.com": "/bank-icons/enpara.png",
    Enpara: "/bank-icons/enpara.png",

    // Fibabanka variations
    Fibabanka: "/bank-icons/fibabanka.png",
    "Fibabanka A.Ş.": "/bank-icons/fibabanka.png",

    // QNB Finansbank variations
    "QNB Finansbank": "/bank-icons/qnb.png",
    "QNB Finansbank A.Ş.": "/bank-icons/qnb.png",
    Finansbank: "/bank-icons/qnb.png",

    // TEB variations
    TEB: "/bank-icons/teb.png",
    "Türkiye Ekonomi Bankası A.Ş.": "/bank-icons/teb.png",
    "Türk Ekonomi Bankası": "/bank-icons/teb.png",

    // ING variations
    ING: "/bank-icons/ing.png",
    "ING Bank A.Ş.": "/bank-icons/ing.png",
    "ING Bank": "/bank-icons/ing.png",

    // Şekerbank variations
    "Şekerbank T.A.Ş.": "/bank-icons/sekerbank.png",
    Şekerbank: "/bank-icons/sekerbank.png",

    // Anadolubank variations
    "Anadolubank A.Ş.": "/bank-icons/anadolubank.png",
    Anadolubank: "/bank-icons/anadolubank.png",

    // Turkish Bank variations
    "Turkish Bank A.Ş.": "/bank-icons/turkish-bank.png",
    "Turkish Bank": "/bank-icons/turkish-bank.png",

    // Citibank variations
    "Citibank A.Ş.": "/bank-icons/citibank.png",
    Citibank: "/bank-icons/citibank.png",

    // Deutsche Bank variations
    "Deutsche Bank A.Ş.": "/bank-icons/deutsche-bank.png",
    "Deutsche Bank": "/bank-icons/deutsche-bank.png",

    // Alternatif Bank variations
    "Alternatif Bank A.Ş.": "/bank-icons/alternatif-bank.png",
    "Alternatif Bank": "/bank-icons/alternatif-bank.png",

    // Burgan Bank variations
    "Burgan Bank A.Ş.": "/bank-icons/burgan-bank.png",
    "Burgan Bank": "/bank-icons/burgan-bank.png",

    // ICBC Turkey Bank variations
    "ICBC Turkey Bank A.Ş.": "/bank-icons/icbc-turkey-bank.png",
    "ICBC Turkey Bank": "/bank-icons/icbc-turkey-bank.png",

    // MUFG Bank Turkey variations
    "MUFG Bank Turkey A.Ş.": "/bank-icons/mufg-bank-turkey.png",
    "MUFG Bank Turkey": "/bank-icons/mufg-bank-turkey.png",

    // Odeabank variations
    "Odeabank A.Ş.": "/bank-icons/odeabank.png",
    Odeabank: "/bank-icons/odeabank.png",

    // Rabobank variations
    "Rabobank A.Ş.": "/bank-icons/rabobank.png",
    Rabobank: "/bank-icons/rabobank.png",

    // HSBC variations
    "HSBC Bank A.Ş.": "/bank-icons/hsbc-bank.png",
    "HSBC Bank": "/bank-icons/hsbc-bank.png",
    HSBC: "/bank-icons/hsbc-bank.png",

    // Intesa Sanpaolo variations
    "Intesa Sanpaolo S.p.A.": "/bank-icons/intesa-sanpaolo.png",
    "Intesa Sanpaolo": "/bank-icons/intesa-sanpaolo.png",

    // Habib Bank variations
    "Habib Bank Limited": "/bank-icons/habib-bank-limited.png",
    "Habib Bank": "/bank-icons/habib-bank-limited.png",

    // Bank Mellat variations
    "Bank Mellat": "/bank-icons/bank-mellat.png",
    Mellat: "/bank-icons/bank-mellat.png",

    // JPMorgan Chase variations
    "JPMorgan Chase Bank N.A.": "/bank-icons/jpmorgan-chase-bank.png",
    "JPMorgan Chase": "/bank-icons/jpmorgan-chase-bank.png",
    JPMorgan: "/bank-icons/jpmorgan-chase-bank.png",

    // Société Générale variations
    "Société Générale (SA)": "/bank-icons/societe-generale.png",
    "Société Générale": "/bank-icons/societe-generale.png",

    // Katılım Bankaları
    "Ziraat Katılım Bankası A.Ş.": "/bank-icons/ziraat-katilim-bankasi.png",
    "Ziraat Katılım": "/bank-icons/ziraat-katilim-bankasi.png",

    "Vakıf Katılım Bankası A.Ş.": "/bank-icons/vakif-katilim-bankasi.png",
    "Vakıf Katılım": "/bank-icons/vakif-katilim-bankasi.png",

    "Türkiye Emlak Katılım Bankası A.Ş.": "/bank-icons/turkiye-emlak-katilim-bankasi.png",
    "Emlak Katılım": "/bank-icons/turkiye-emlak-katilim-bankasi.png",

    "Kuveyt Türk Katılım Bankası A.Ş.": "/bank-icons/kuveyt-turk-katilim-bankasi.png",
    "Kuveyt Türk": "/bank-icons/kuveyt-turk-katilim-bankasi.png",

    "Albaraka Türk Katılım Bankası A.Ş.": "/bank-icons/albaraka-turk-katilim-bankasi.png",
    "Albaraka Türk": "/bank-icons/albaraka-turk-katilim-bankasi.png",
    Albaraka: "/bank-icons/albaraka-turk-katilim-bankasi.png",

    "Türkiye Finans Katılım Bankası A.Ş.": "/bank-icons/turkiye-finans-katilim-bankasi.png",
    "Türkiye Finans": "/bank-icons/turkiye-finans-katilim-bankasi.png",

    "Hayat Finans Katılım Bankası A.Ş.": "/bank-icons/hayat-finans-katilim-bankasi.png",
    "Hayat Finans": "/bank-icons/hayat-finans-katilim-bankasi.png",

    "Dünya Katılım Bankası A.Ş.": "/bank-icons/dunya-katilim-bankasi.png",
    "Dünya Katılım": "/bank-icons/dunya-katilim-bankasi.png",

    // Kalkınma ve Yatırım Bankaları
    "İller Bankası A.Ş.": "/bank-icons/iller-bankasi.png",
    "İller Bankası": "/bank-icons/iller-bankasi.png",
    İlbank: "/bank-icons/iller-bankasi.png",

    "Türk Eximbank": "/bank-icons/turk-eximbank.png",
    Eximbank: "/bank-icons/turk-eximbank.png",

    "Türkiye Kalkınma ve Yatırım Bankası A.Ş.": "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
    "Kalkınma Bankası": "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",
    TKYB: "/bank-icons/turkiye-kalkinma-ve-yatirim-bankasi.png",

    "Türkiye Sınai Kalkınma Bankası A.Ş.": "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
    "Sınai Kalkınma": "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",
    TSKB: "/bank-icons/turkiye-sinai-kalkinma-bankasi.png",

    "Aktif Yatırım Bankası A.Ş.": "/bank-icons/aktif-yatirim-bankasi.png",
    "Aktif Yatırım": "/bank-icons/aktif-yatirim-bankasi.png",

    "Nurol Yatırım Bankası A.Ş.": "/bank-icons/nurol-yatirim-bankasi.png",
    "Nurol Yatırım": "/bank-icons/nurol-yatirim-bankasi.png",

    "Pasha Yatırım Bankası A.Ş.": "/bank-icons/pasha-yatirim-bankasi.png",
    "PASHA Yatırım Bankası A.Ş.": "/bank-icons/pasha-yatirim-bankasi.png",
    "Pasha Yatırım": "/bank-icons/pasha-yatirim-bankasi.png",

    "BankPozitif Kredi ve Kalkınma Bankası A.Ş.": "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",
    BankPozitif: "/bank-icons/bankpozitif-kredi-ve-kalkinma-bankasi.png",

    "Merrill Lynch Yatırım Bank A.Ş.": "/bank-icons/merrill-lynch-yatirim-bank.png",
    "Merrill Lynch": "/bank-icons/merrill-lynch-yatirim-bank.png",

    "Golden Global Yatırım Bankası A.Ş.": "/bank-icons/golden-global-yatirim-bankasi.png",
    "Golden Global": "/bank-icons/golden-global-yatirim-bankasi.png",

    "GSD Yatırım Bankası A.Ş.": "/bank-icons/gsd-yatirim-bankasi.png",
    "GSD Yatırım": "/bank-icons/gsd-yatirim-bankasi.png",
    GSD: "/bank-icons/gsd-yatirim-bankasi.png",

    "İstanbul Takas ve Saklama Bankası A.Ş.": "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
    "İstanbul Takas": "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",
    Takasbank: "/bank-icons/istanbul-takas-ve-saklama-bankasi.png",

    "Diler Yatırım Bankası A.Ş.": "/bank-icons/diler-yatirim-bankasi.png",
    "Diler Yatırım": "/bank-icons/diler-yatirim-bankasi.png",

    "Standard Chartered Yatırım Bankası Türk A.Ş.": "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",
    "Standard Chartered": "/bank-icons/standard-chartered-yatirim-bankasi-turk.png",

    // Dijital Bankalar
    "Colendi Bank A.Ş.": "/bank-icons/colendi-bank.png",
    "Colendi Bank": "/bank-icons/colendi-bank.png",
    Colendi: "/bank-icons/colendi-bank.png",

    // TMSF Bankaları
    "Adabank A.Ş.": "/bank-icons/adabank.png",
    Adabank: "/bank-icons/adabank.png",

    "Birleşik Fon Bankası A.Ş.": "/bank-icons/birlesik-fon-bankasi.png",
    "Birleşik Fon": "/bank-icons/birlesik-fon-bankasi.png",

    "Türk Ticaret Bankası A.Ş.": "/bank-icons/turk-ticaret-bankasi.png",
    "Türk Ticaret": "/bank-icons/turk-ticaret-bankasi.png",
  }

  // Önce tam eşleşme ara
  if (bankMappings[bankName]) {
    console.log("🎯 Fallback tam eşleşme:", bankName, "->", bankMappings[bankName])
    return bankMappings[bankName]
  }

  // Sonra kısmi eşleşme ara (case insensitive)
  const normalizedBankName = bankName.toLowerCase().trim()
  for (const [key, value] of Object.entries(bankMappings)) {
    const normalizedKey = key.toLowerCase().trim()
    if (normalizedBankName.includes(normalizedKey) || normalizedKey.includes(normalizedBankName)) {
      console.log("🔍 Fallback kısmi eşleşme:", bankName, "->", key, "->", value)
      return value
    }
  }

  console.log("❌ Fallback eşleşme bulunamadı:", bankName)
  return ""
}

export default function BankLogo({ bankName, logoUrl, size = "md", className = "" }: BankLogoProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const colorClass = getBankColor(bankName)
  const sizeClass = getSizeClasses(size)
  const iconSizeClass = getIconSize(size)

  // Banka adının ilk 2 harfini al
  const initials = bankName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  // Logo yolu belirleme - Önce logoUrl prop'u, sonra fallback mapping
  const logoPath = logoUrl && logoUrl.trim() !== "" ? logoUrl : getBankLogoPath(bankName)

  // Test için logo yolunu konsola yazdır - sadece development'ta
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🏦 BankLogo Debug:", {
        bankName,
        logoUrl: logoUrl || "YOK",
        logoPath: logoPath || "YOK",
        imageLoaded,
        imageError,
        source: logoUrl && logoUrl.trim() !== "" ? "SUPABASE" : "FALLBACK",
      })
    }
  }, [bankName, logoUrl, logoPath, imageLoaded, imageError])

  // Fallback göster
  const renderFallback = () => (
    <div className={`${colorClass} ${sizeClass} rounded-lg flex items-center justify-center shadow-lg ${className}`}>
      {initials.length >= 2 ? (
        <span className="text-white font-bold text-sm">{initials}</span>
      ) : (
        <Building2 className={`${iconSizeClass} text-white`} />
      )}
    </div>
  )

  // Eğer logo yüklenemezse fallback göster
  if (imageError || !logoPath) {
    return renderFallback()
  }

  return (
    <div className={`${sizeClass} rounded-lg overflow-hidden shadow-lg ${className} relative`}>
      <img
        src={logoPath || "/placeholder.svg"}
        alt={`${bankName} logosu`}
        className="w-full h-full object-cover scale-110"
        onLoad={() => {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Logo yüklendi:", logoPath)
          }
          setImageLoaded(true)
          setImageError(false)
        }}
        onError={() => {
          if (process.env.NODE_ENV === "development") {
            console.log("❌ Logo yüklenemedi:", logoPath)
          }
          setImageError(true)
          setImageLoaded(false)
        }}
        style={{
          display: imageLoaded && !imageError ? "block" : "none",
        }}
      />

      {/* Loading state veya error state */}
      {(!imageLoaded || imageError) && (
        <div className={`${colorClass} w-full h-full flex items-center justify-center absolute inset-0`}>
          {!imageError ? (
            <div className="animate-pulse">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
          ) : (
            <span className="text-white font-bold text-sm">{initials}</span>
          )}
        </div>
      )}
    </div>
  )
}
