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
    bgColor: "bg-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-600",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-600",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-600",
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
            <div className={`${config.bgColor} p-2.5 rounded-xl`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{notification.title}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {format(new Date(notification.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mesaj */}
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-black/20 p-4 rounded-lg backdrop-blur-sm">
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
