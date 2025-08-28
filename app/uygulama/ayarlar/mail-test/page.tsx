"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, Send, CheckCircle, XCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface TestResult {
  id: string
  type: string
  email: string
  status: "sending" | "success" | "error"
  message?: string
  timestamp: Date
}

export default function MailTestPage() {
  const [testEmail, setTestEmail] = useState("")
  const [customSubject, setCustomSubject] = useState("Test E-postası - KrediTakip")
  const [customMessage, setCustomMessage] = useState("Bu bir test e-postasıdır.")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const addTestResult = (type: string, email: string, status: "sending" | "success" | "error", message?: string) => {
    const result: TestResult = {
      id: Date.now().toString(),
      type,
      email,
      status,
      message,
      timestamp: new Date(),
    }

    setTestResults((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  const updateTestResult = (id: string, status: "success" | "error", message?: string) => {
    setTestResults((prev) => prev.map((result) => (result.id === id ? { ...result, status, message } : result)))
  }

  const sendTestEmail = async (type: "custom" | "payment_reminder" | "overdue_notice") => {
    if (!testEmail) {
      toast({
        title: "Hata",
        description: "Lütfen test e-posta adresini girin.",
        variant: "destructive",
      })
      return
    }

    setLoading(type)
    const testId = Date.now().toString()
    addTestResult(type, testEmail, "sending")

    try {
      let response

      if (type === "custom") {
        // Send custom test email
        response = await fetch("/api/notifications/test-mailersend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: testEmail,
            subject: customSubject,
            message: customMessage,
          }),
        })
      } else {
        // Send payment reminder test
        response = await fetch("/api/notifications/send-reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testMode: true,
            testEmail: testEmail,
            type: type === "payment_reminder" ? "3_days_before" : "overdue",
          }),
        })
      }

      const result = await response.json()

      if (result.success) {
        updateTestResult(testId, "success", `E-posta başarıyla gönderildi`)
        toast({
          title: "Başarılı! 📧",
          description: "Test e-postası başarıyla gönderildi.",
        })
      } else {
        throw new Error(result.error || "Bilinmeyen hata")
      }
    } catch (error) {
      console.error("Mail test error:", error)
      updateTestResult(testId, "error", error instanceof Error ? error.message : "Bilinmeyen hata")
      toast({
        title: "Hata ❌",
        description: "E-posta gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "sending":
        return <Badge variant="secondary">Gönderiliyor</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Başarılı
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Hata</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="text-white border-white/20 hover:bg-white/10 print:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">E-posta Test Sistemi</h1>
            <p className="text-blue-100 mt-1">
              MailerSend entegrasyonunu test edin ve e-posta gönderimini kontrol edin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Ayarları</CardTitle>
              <CardDescription>E-posta gönderim testleri için gerekli bilgileri girin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Test E-posta Adresi</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="customSubject">Özel E-posta Konusu</Label>
                <Input id="customSubject" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="customMessage">Özel E-posta Mesajı</Label>
                <Textarea
                  id="customMessage"
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Seçenekleri</CardTitle>
              <CardDescription>Farklı e-posta türlerini test edin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => sendTestEmail("custom")} disabled={loading === "custom"} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {loading === "custom" ? "Gönderiliyor..." : "Özel E-posta Gönder"}
              </Button>

              <Button
                onClick={() => sendTestEmail("payment_reminder")}
                disabled={loading === "payment_reminder"}
                variant="outline"
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading === "payment_reminder" ? "Gönderiliyor..." : "Ödeme Hatırlatması Test Et"}
              </Button>

              <Button
                onClick={() => sendTestEmail("overdue_notice")}
                disabled={loading === "overdue_notice"}
                variant="outline"
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {loading === "overdue_notice" ? "Gönderiliyor..." : "Gecikme Bildirimi Test Et"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Sonuçları</CardTitle>
            <CardDescription>Son e-posta gönderim testlerinin sonuçları.</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz test yapılmadı.</p>
                <p className="text-sm">Yukarıdaki butonları kullanarak test başlatın.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div key={result.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {result.type === "custom"
                            ? "Özel E-posta"
                            : result.type === "payment_reminder"
                              ? "Ödeme Hatırlatması"
                              : "Gecikme Bildirimi"}
                        </span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                      {result.message && <p className="text-xs text-muted-foreground mt-1">{result.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.timestamp.toLocaleTimeString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
