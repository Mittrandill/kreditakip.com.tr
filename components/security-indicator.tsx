"use client"

import { ShieldCheck, ShieldAlert, Eye, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

interface SecurityIndicatorProps {
  isEncrypted: boolean
  dataType: "card_number" | "cardholder_name" | "cvv" | "expiry"
  encryptedValue?: string
  decryptedValue?: string
  showDecrypted?: boolean
  onToggleVisibility?: () => void
}

export function SecurityIndicator({
  isEncrypted,
  dataType,
  encryptedValue,
  decryptedValue,
  showDecrypted = false,
  onToggleVisibility,
}: SecurityIndicatorProps) {
  const [isVisible, setIsVisible] = useState(showDecrypted)

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case "card_number":
        return "Kart Numarası"
      case "cardholder_name":
        return "Kart Sahibi"
      case "cvv":
        return "CVV"
      case "expiry":
        return "Son Kullanma"
      default:
        return "Veri"
    }
  }

  const maskValue = (value: string, type: string) => {
    if (!value) return "****"

    switch (type) {
      case "card_number":
        return value.replace(/\d(?=\d{4})/g, "*")
      case "cardholder_name":
        return value
          .split(" ")
          .map((part) => (part.length > 2 ? part[0] + "*".repeat(part.length - 2) + part[part.length - 1] : part))
          .join(" ")
      case "cvv":
        return "***"
      case "expiry":
        return "**/**"
      default:
        return "*".repeat(Math.min(value.length, 8))
    }
  }

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible)
    onToggleVisibility?.()
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isEncrypted ? "default" : "destructive"}
              className={`flex items-center gap-1 ${
                isEncrypted
                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                  : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
              }`}
            >
              {isEncrypted ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              <span className="text-xs">{isEncrypted ? "Şifreli" : "Şifresiz"}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {getDataTypeLabel(dataType)} {isEncrypted ? "güvenli şekilde şifrelenmiş" : "şifrelenmemiş"}
            </p>
            {isEncrypted && encryptedValue && (
              <p className="text-xs text-gray-500 mt-1">Şifreli: {encryptedValue.substring(0, 20)}...</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {decryptedValue && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{isVisible ? decryptedValue : maskValue(decryptedValue, dataType)}</span>
          <Button variant="ghost" size="sm" onClick={handleToggleVisibility} className="h-6 w-6 p-0">
            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      )}
    </div>
  )
}
