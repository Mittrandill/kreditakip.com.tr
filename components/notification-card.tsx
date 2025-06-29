"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import { AlertTriangle, CheckCircle, Info, Clock, AlertCircle, Trash2, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface NotificationCardProps {
  notification: {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "error" | "success"
    is_read: boolean
    created_at: string
    credits?: {
      credit_code: string
      banks: {
        name: string
        logo_url: string | null
      }
    } | null
  }
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-l-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-l-orange-400",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-l-red-400",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-l-green-400",
  },
}

export function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <Card
      className={`
        transition-all duration-200 hover:shadow-md border-l-4 group
        ${config.borderColor} 
        ${notification.is_read ? "bg-white opacity-75" : `${config.bgColor} shadow-sm`}
      `}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-full bg-white shadow-sm ${config.color} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={`font-semibold text-lg ${notification.is_read ? "text-gray-600" : "text-gray-900"}`}>
                  {notification.title}
                </h3>
                {!notification.is_read && <Badge className="bg-emerald-500 text-white text-xs px-2 py-1">Yeni</Badge>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-gray-500 hover:text-emerald-600 h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message */}
            <p className={`text-base leading-relaxed mb-4 ${notification.is_read ? "text-gray-500" : "text-gray-700"}`}>
              {notification.message}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Bank Info */}
                {notification.credits && (
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm">
                    <BankLogo bankName={notification.credits.banks.name} size="sm" />
                    <span className="font-medium text-sm text-gray-700">{notification.credits.credit_code}</span>
                  </div>
                )}

                {/* Time */}
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
