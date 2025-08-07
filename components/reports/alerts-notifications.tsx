"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Settings,
  Mail,
  Smartphone,
  CreditCard,
  Target,
  Shield,
  Info,
  X,
  Trash2,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"

interface AlertsNotificationsProps {
  payments: any[]
  credits: any[]
  creditCards: any[]
}

interface Alert {
  id: string
  type: "payment" | "debt" | "utilization" | "performance" | "risk"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  amount?: number
  dueDate?: string
  isActive: boolean
  createdAt: Date
  actionRequired: boolean
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  frequency: "immediate" | "daily" | "weekly"
  types: {
    payment: boolean
    debt: boolean
    utilization: boolean
    performance: boolean
    risk: boolean
  }
}

export function AlertsAndNotifications({ payments, credits, creditCards }: AlertsNotificationsProps) {
  const [activeTab, setActiveTab] = useState("alerts")
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    frequency: "daily",
    types: {
      payment: true,
      debt: true,
      utilization: true,
      performance: false,
      risk: true,
    },
  })

  // Generate smart alerts based on data
  const alerts = useMemo(() => {
    const generatedAlerts: Alert[] = []
    const now = new Date()

    // Payment due alerts
    payments.forEach((payment) => {
      const dueDate = new Date(payment.due_date)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (payment.status === "pending") {
        if (daysUntilDue < 0) {
          generatedAlerts.push({
            id: `overdue-${payment.id}`,
            type: "payment",
            severity: "critical",
            title: "Geciken Ödeme",
            description: `${payment.credits?.banks?.name || "Bilinmeyen Banka"} için ${formatCurrency(payment.total_payment)} tutarında ödemeniz ${Math.abs(daysUntilDue)} gün gecikmiş.`,
            amount: payment.total_payment,
            dueDate: payment.due_date,
            isActive: true,
            createdAt: new Date(),
            actionRequired: true,
          })
        } else if (daysUntilDue <= 3) {
          generatedAlerts.push({
            id: `due-soon-${payment.id}`,
            type: "payment",
            severity: daysUntilDue <= 1 ? "high" : "medium",
            title: "Yaklaşan Ödeme",
            description: `${payment.credits?.banks?.name || "Bilinmeyen Banka"} için ${formatCurrency(payment.total_payment)} tutarında ödemeniz ${daysUntilDue} gün içinde.`,
            amount: payment.total_payment,
            dueDate: payment.due_date,
            isActive: true,
            createdAt: new Date(),
            actionRequired: true,
          })
        }
      }
    })

    // High utilization alerts
    creditCards.forEach((card) => {
      if (card.utilization_rate > 80) {
        generatedAlerts.push({
          id: `high-util-${card.id}`,
          type: "utilization",
          severity: card.utilization_rate > 90 ? "critical" : "high",
          title: "Yüksek Kart Kullanımı",
          description: `${card.card_name} kartınızın kullanım oranı %${card.utilization_rate.toFixed(1)}. Kredi puanınız etkilenebilir.`,
          amount: card.current_debt,
          isActive: true,
          createdAt: new Date(),
          actionRequired: true,
        })
      }
    })

    // High debt alerts
    const totalDebt =
      credits.reduce((sum, credit) => sum + credit.remaining_debt, 0) +
      creditCards.reduce((sum, card) => sum + card.current_debt, 0)

    if (totalDebt > 100000) {
      generatedAlerts.push({
        id: "high-debt",
        type: "debt",
        severity: totalDebt > 500000 ? "critical" : "high",
        title: "Yüksek Borç Yükü",
        description: `Toplam borcunuz ${formatCurrency(totalDebt)}. Borç konsolidasyonu düşünebilirsiniz.`,
        amount: totalDebt,
        isActive: true,
        createdAt: new Date(),
        actionRequired: false,
      })
    }

    // Performance alerts
    const recentPayments = payments.filter((p) => {
      const paymentDate = new Date(p.payment_date || p.due_date)
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return paymentDate >= threeMonthsAgo
    })

    const latePayments = recentPayments.filter(
      (p) => p.status === "paid" && p.payment_date && new Date(p.payment_date) > new Date(p.due_date),
    )

    const latePaymentRate = recentPayments.length > 0 ? (latePayments.length / recentPayments.length) * 100 : 0

    if (latePaymentRate > 20) {
      generatedAlerts.push({
        id: "poor-performance",
        type: "performance",
        severity: latePaymentRate > 50 ? "critical" : "high",
        title: "Ödeme Performansı Düşük",
        description: `Son 3 ayda ödemelerinizin %${latePaymentRate.toFixed(1)}'i geç yapıldı. Kredi puanınız etkilenebilir.`,
        isActive: true,
        createdAt: new Date(),
        actionRequired: true,
      })
    }

    // Risk assessment alert
    const riskScore = calculateRiskScore(totalDebt, latePaymentRate, creditCards)
    if (riskScore > 70) {
      generatedAlerts.push({
        id: "high-risk",
        type: "risk",
        severity: riskScore > 85 ? "critical" : "high",
        title: "Yüksek Finansal Risk",
        description: `Risk skorunuz ${riskScore.toFixed(1)}. Finansal durumunuzu gözden geçirmeniz önerilir.`,
        isActive: true,
        createdAt: new Date(),
        actionRequired: true,
      })
    }

    return generatedAlerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return (severityOrder as any)[b.severity] - (severityOrder as any)[a.severity]
    })
  }, [payments, credits, creditCards])

  const calculateRiskScore = (totalDebt: number, latePaymentRate: number, creditCards: any[]) => {
    let score = 0

    // Debt amount factor (0-30 points)
    if (totalDebt > 500000) score += 30
    else if (totalDebt > 200000) score += 20
    else if (totalDebt > 100000) score += 10

    // Late payment factor (0-40 points)
    score += (latePaymentRate / 100) * 40

    // Credit utilization factor (0-30 points)
    const avgUtilization =
      creditCards.length > 0
        ? creditCards.reduce((sum, card) => sum + card.utilization_rate, 0) / creditCards.length
        : 0
    score += (avgUtilization / 100) * 30

    return Math.min(100, score)
  }

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass =
      severity === "critical"
        ? "text-red-500"
        : severity === "high"
          ? "text-orange-500"
          : severity === "medium"
            ? "text-yellow-500"
            : "text-blue-500"

    switch (type) {
      case "payment":
        return <Clock className={`h-5 w-5 ${iconClass}`} />
      case "debt":
        return <DollarSign className={`h-5 w-5 ${iconClass}`} />
      case "utilization":
        return <CreditCard className={`h-5 w-5 ${iconClass}`} />
      case "performance":
        return <TrendingDown className={`h-5 w-5 ${iconClass}`} />
      case "risk":
        return <Shield className={`h-5 w-5 ${iconClass}`} />
      default:
        return <Info className={`h-5 w-5 ${iconClass}`} />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Kritik</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Yüksek</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Orta</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Düşük</Badge>
      default:
        return <Badge variant="outline">Bilinmeyen</Badge>
    }
  }

  const activeAlerts = alerts.filter((alert) => alert.isActive)
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical")
  const actionRequiredAlerts = activeAlerts.filter((alert) => alert.actionRequired)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl shadow-md">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Akıllı Uyarılar & Bildirimler</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  AI destekli finansal uyarılar ve özelleştirilebilir bildirimler
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                <Zap className="h-3 w-3 mr-1" />
                {activeAlerts.length} Aktif Uyarı
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Kritik Uyarılar</p>
                <p className="text-2xl font-bold text-red-900">{criticalAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Aksiyon Gereken</p>
                <p className="text-2xl font-bold text-orange-900">{actionRequiredAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Toplam Uyarı</p>
                <p className="text-2xl font-bold text-blue-900">{activeAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Sistem Durumu</p>
                <p className="text-sm font-bold text-green-900">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Uyarılar
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card className="shadow-lg rounded-xl border-0">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Harika! Aktif uyarınız yok</h3>
                <p className="text-gray-600">Finansal durumunuz stabil görünüyor. Böyle devam edin!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {getAlertIcon(alert.type, alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            {getSeverityBadge(alert.severity)}
                            {alert.actionRequired && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200">Aksiyon Gerekli</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDate(alert.createdAt)}</span>
                            {alert.amount && <span>Tutar: {formatCurrency(alert.amount)}</span>}
                            {alert.dueDate && <span>Vade: {formatDate(new Date(alert.dueDate))}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.actionRequired && (
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            İşlem Yap
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-lg rounded-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Bildirim Geçmişi</CardTitle>
              <CardDescription>Son gönderilen bildirimler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: "1",
                    title: "Ödeme Hatırlatması",
                    message: "Yarın vadesi gelen ödemeniz bulunmaktadır.",
                    type: "email",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    status: "delivered",
                  },
                  {
                    id: "2",
                    title: "Yüksek Kullanım Uyarısı",
                    message: "Kredi kartı kullanım oranınız %85'e ulaştı.",
                    type: "push",
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    status: "delivered",
                  },
                  {
                    id: "3",
                    title: "Haftalık Özet",
                    message: "Bu haftaki finansal aktivitelerinizin özeti hazır.",
                    type: "email",
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    status: "delivered",
                  },
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {notification.type === "email" ? (
                        <Mail className="h-4 w-4 text-blue-600" />
                      ) : notification.type === "sms" ? (
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bell className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{notification.timestamp.toLocaleString("tr-TR")}</span>
                        <Badge
                          className={`text-xs ${
                            notification.status === "delivered"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {notification.status === "delivered" ? "Teslim Edildi" : "Beklemede"}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-lg rounded-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Bildirim Ayarları</CardTitle>
              <CardDescription>Bildirim tercihlerinizi özelleştirin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Bildirim Kanalları</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="font-medium">E-posta</Label>
                        <p className="text-sm text-gray-600">E-posta ile bildirim al</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, email: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="font-medium">SMS</Label>
                        <p className="text-sm text-gray-600">SMS ile bildirim al</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, sms: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="font-medium">Push Bildirimleri</Label>
                        <p className="text-sm text-gray-600">Tarayıcı bildirimleri</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.push}
                      onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, push: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Frequency */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Bildirim Sıklığı</h3>
                <Select
                  value={notificationSettings.frequency}
                  onValueChange={(value: any) => setNotificationSettings((prev) => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Anında</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Bildirim Türleri</h3>
                <div className="space-y-3">
                  {Object.entries(notificationSettings.types).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {type === "payment" && <Clock className="h-5 w-5 text-gray-600" />}
                        {type === "debt" && <DollarSign className="h-5 w-5 text-gray-600" />}
                        {type === "utilization" && <CreditCard className="h-5 w-5 text-gray-600" />}
                        {type === "performance" && <TrendingUp className="h-5 w-5 text-gray-600" />}
                        {type === "risk" && <Shield className="h-5 w-5 text-gray-600" />}
                        <div>
                          <Label className="font-medium">
                            {type === "payment" && "Ödeme Bildirimleri"}
                            {type === "debt" && "Borç Bildirimleri"}
                            {type === "utilization" && "Kullanım Oranı"}
                            {type === "performance" && "Performans"}
                            {type === "risk" && "Risk Uyarıları"}
                          </Label>
                          <p className="text-sm text-gray-600">
                            {type === "payment" && "Ödeme vadesi ve hatırlatmaları"}
                            {type === "debt" && "Borç durumu ve değişiklikleri"}
                            {type === "utilization" && "Kredi kartı kullanım oranı uyarıları"}
                            {type === "performance" && "Ödeme performansı değerlendirmeleri"}
                            {type === "risk" && "Finansal risk değerlendirmeleri"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            types: { ...prev.types, [type]: checked },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Alert Thresholds */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Özel Uyarı Eşikleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kredi Kartı Kullanım Uyarısı (%)</Label>
                    <Input type="number" placeholder="80" defaultValue="80" />
                  </div>
                  <div className="space-y-2">
                    <Label>Yüksek Borç Uyarısı (TL)</Label>
                    <Input type="number" placeholder="100000" defaultValue="100000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ödeme Hatırlatması (gün önce)</Label>
                    <Input type="number" placeholder="3" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Skoru Uyarısı</Label>
                    <Input type="number" placeholder="70" defaultValue="70" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarları Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
