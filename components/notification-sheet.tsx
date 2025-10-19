"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import { Info, AlertTriangle, AlertCircle, CheckCircle, Trash2, Clock, Calendar } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    badgeClass:
      "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent hover:from-blue-700 hover:to-indigo-800",
    label: "Bilgi",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
    badgeClass:
      "bg-gradient-to-r from-orange-600 to-red-700 text-white border-transparent hover:from-orange-700 hover:to-red-800",
    label: "Uyarı",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/30",
    badgeClass:
      "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800",
    label: "Hata",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    badgeClass:
      "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800",
    label: "Başarılı",
  },
}

interface NotificationSheetProps {
  notification: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function NotificationSheet({ notification, open, onOpenChange, onDelete }: NotificationSheetProps) {
  if (!notification) return null

  const typeKey = (notification.type as keyof typeof typeConfig) ?? "info"
  const config = typeConfig[typeKey] ?? typeConfig.info
  const Icon = config.icon
  const bankInfo = notification.credits?.banks

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <SheetTitle className="text-xl">{notification.title}</SheetTitle>
          </div>
          <SheetDescription className="text-sm">
            {format(new Date(notification.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Mesaj */}
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{notification.message}</div>

          {/* Banka Bilgisi - Sadece varsa göster */}
          {bankInfo && (
            <>
              <Separator />
              <div className="flex items-center gap-3 py-2">
                <BankLogo bankName={bankInfo.name || "Banka"} logoUrl={bankInfo.logo_url} size="sm" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{bankInfo.name}</p>
                  {notification.credits?.credit_code && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {notification.credits.credit_code}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Alt Bilgiler */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex gap-2 pt-4">
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Sil
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1">
              Kapat
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
