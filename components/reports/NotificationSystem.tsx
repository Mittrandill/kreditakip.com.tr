"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  X,
  Settings,
  Mail,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"

export type NotificationType = 'success' | 'warning' | 'error' | 'info'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionable?: boolean
  actionText?: string
  actionUrl?: string
  category: string
  data?: any
}

export interface NotificationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: {
    type: 'debt_threshold' | 'overdue_payment' | 'utilization_rate' | 'payment_trend' | 'risk_score'
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
    value: number | string
  }[]
  actions: {
    type: 'browser' | 'email' | 'whatsapp'
    enabled: boolean
    template?: string
  }[]
  priority: NotificationPriority
  category: string
}

interface NotificationSystemProps {
  notifications: Notification[]
  onNotificationRead: (id: string) => void
  onNotificationDismiss: (id: string) => void
  onNotificationAction: (notification: Notification) => void
  rules: NotificationRule[]
  onRuleUpdate: (rule: NotificationRule) => void
  onRuleCreate: (rule: Partial<NotificationRule>) => void
  onRuleDelete: (id: string) => void
}

const notificationIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info
}

const notificationColors = {
  success: "text-emerald-600 bg-emerald-50 border-emerald-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  error: "text-red-600 bg-red-50 border-red-200",
  info: "text-blue-600 bg-blue-50 border-blue-200"
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700"
}

export function NotificationSystem({
  notifications,
  onNotificationRead,
  onNotificationDismiss,
  onNotificationAction,
  rules,
  onRuleUpdate,
  onRuleCreate,
  onRuleDelete
}: NotificationSystemProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    name: "",
    description: "",
    enabled: true,
    conditions: [],
    actions: [],
    priority: 'medium',
    category: 'general'
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onNotificationRead(notification.id)
    }
    if (notification.actionable) {
      onNotificationAction(notification)
    }
  }

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const category = notification.category || 'general'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  const renderNotification = (notification: Notification) => {
    const Icon = (notificationIcons as any)[notification.type]
    const isRecent = Date.now() - notification.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes

    return (
      <Card 
        key={notification.id}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          !notification.read && "ring-2 ring-emerald-200",
          notificationColors[notification.type],
          isRecent && "animate-pulse"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm leading-tight">
                    {notification.title}
                  </h4>
                  <p className="text-sm opacity-90 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={priorityColors[notification.priority]}>
                    {notification.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNotificationDismiss(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs opacity-75">
                  {notification.timestamp.toLocaleString('tr-TR')}
                </span>
                
                {notification.actionable && (
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                    {notification.actionText || 'İncele'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Bildirimler</CardTitle>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-700 animate-pulse">
                {criticalCount} Kritik
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ayarlar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bildirim Kuralları</CardTitle>
            <p className="text-sm text-gray-600">
              Otomatik bildirimler için kurallar oluşturun ve yönetin
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Rules */}
            <div className="space-y-4">
              <h4 className="font-semibold">Mevcut Kurallar</h4>
              {rules.map(rule => (
                <Card key={rule.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(enabled) => 
                              onRuleUpdate({ ...rule, enabled })
                            }
                          />
                          <div>
                            <h5 className="font-semibold text-sm">{rule.name}</h5>
                            <p className="text-xs text-gray-600">{rule.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityColors[rule.priority]}>
                          {rule.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRuleDelete(rule.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Rule conditions preview */}
                    <div className="mt-3 text-xs text-gray-500">
                      {rule.conditions.map((condition, index) => (
                        <span key={index} className="mr-2">
                          {condition.type} {condition.operator} {condition.value}
                          {index < rule.conditions.length - 1 && ' AND '}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create New Rule */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold">Yeni Kural Oluştur</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule-name">Kural Adı</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="Örn: Yüksek kredi kartı kullanımı"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rule-priority">Öncelik</Label>
                  <Select 
                    value={newRule.priority} 
                    onValueChange={(priority: NotificationPriority) => 
                      setNewRule({ ...newRule, priority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="critical">Kritik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="rule-description">Açıklama</Label>
                <Textarea
                  id="rule-description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Bu kural ne zaman tetiklenecek?"
                  rows={2}
                />
              </div>
              
              <Button 
                onClick={() => {
                  onRuleCreate(newRule)
                  setNewRule({
                    name: "",
                    description: "",
                    enabled: true,
                    conditions: [],
                    actions: [],
                    priority: 'medium',
                    category: 'general'
                  })
                }}
                disabled={!newRule.name}
              >
                Kural Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-6">
        {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-lg capitalize">{category}</h3>
              <Badge variant="outline">
                {categoryNotifications.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {categoryNotifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 10) // Show only latest 10 per category
                .map(renderNotification)
              }
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Henüz bildirim yok</h3>
              <p className="text-gray-600">
                Sistem otomatik olarak önemli finansal durumlar hakkında sizi bilgilendirecek.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Notification service for creating smart notifications
export class NotificationService {
  static createDebtThresholdNotification(totalDebt: number, threshold: number): Notification {
    return {
      id: `debt-threshold-${Date.now()}`,
      type: totalDebt > threshold * 1.5 ? 'error' : 'warning',
      priority: totalDebt > threshold * 1.5 ? 'critical' : 'high',
      title: 'Yüksek Borç Uyarısı',
      message: `Toplam borcunuz ${formatCurrency(totalDebt)} olarak belirlenen ${formatCurrency(threshold)} limitini aştı.`,
      timestamp: new Date(),
      read: false,
      actionable: true,
      actionText: 'Borç Planı Oluştur',
      actionUrl: '/uygulama/krediler',
      category: 'debt',
      data: { totalDebt, threshold }
    }
  }

  static createOverduePaymentNotification(overdueCount: number, totalAmount: number): Notification {
    return {
      id: `overdue-${Date.now()}`,
      type: 'error',
      priority: 'critical',
      title: 'Geciken Ödemeler',
      message: `${overdueCount} adet ödemeniz gecikmiş. Toplam ${formatCurrency(totalAmount)}`,
      timestamp: new Date(),
      read: false,
      actionable: true,
      actionText: 'Ödemeleri Görüntüle',
      actionUrl: '/uygulama/odeme-plani',
      category: 'payments',
      data: { overdueCount, totalAmount }
    }
  }

  static createUtilizationWarning(cardName: string, utilizationRate: number): Notification {
    return {
      id: `utilization-${Date.now()}`,
      type: utilizationRate > 90 ? 'error' : 'warning',
      priority: utilizationRate > 90 ? 'high' : 'medium',
      title: 'Yüksek Kart Kullanımı',
      message: `${cardName} kartınızın kullanım oranı %${utilizationRate.toFixed(1)} seviyesinde.`,
      timestamp: new Date(),
      read: false,
      actionable: true,
      actionText: 'Kartları Yönet',
      actionUrl: '/uygulama/kredi-kartlari',
      category: 'cards',
      data: { cardName, utilizationRate }
    }
  }

  static createPositiveTrendNotification(improvement: string): Notification {
    return {
      id: `positive-trend-${Date.now()}`,
      type: 'success',
      priority: 'low',
      title: 'Finansal İyileşme',
      message: `Tebrikler! ${improvement}`,
      timestamp: new Date(),
      read: false,
      actionable: false,
      category: 'achievements',
      data: { improvement }
    }
  }

  static createRiskScoreNotification(score: number, level: string): Notification {
    let type: NotificationType = 'info'
    let priority: NotificationPriority = 'low'
    
    if (level === 'critical') {
      type = 'error'
      priority = 'critical'
    } else if (level === 'high') {
      type = 'warning'
      priority = 'high'
    } else if (level === 'medium') {
      type = 'warning'
      priority = 'medium'
    }

    return {
      id: `risk-score-${Date.now()}`,
      type,
      priority,
      title: 'Risk Skoru Güncellendi',
      message: `Finansal risk skorunuz ${score}/100 (${level.toUpperCase()}) olarak hesaplandı.`,
      timestamp: new Date(),
      read: false,
      actionable: true,
      actionText: 'Risk Analizi',
      actionUrl: '/uygulama/risk-analizi',
      category: 'risk',
      data: { score, level }
    }
  }
}