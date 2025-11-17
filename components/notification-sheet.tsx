"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{notification.title}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {format(new Date(notification.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
              </DialogDescription>
            </div>
            <Badge className={config.badgeClass}>{config.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mesaj */}
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
            {notification.message}
          </div>

          {/* Banka Bilgisi - Sadece varsa göster */}
          {bankInfo && (
            <>
              <Separator />
              <div className="flex items-center gap-3 py-2 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 px-4 py-3 rounded-lg">
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

          {/* Alt Bilgiler */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(notification.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
