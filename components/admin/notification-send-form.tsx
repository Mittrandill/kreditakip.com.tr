"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Users, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface NotificationSendFormProps {
  planCounts: {
    free: number
    pro: number
    premium: number
    all: number
  }
}

export function NotificationSendForm({ planCounts }: NotificationSendFormProps) {
  const [target, setTarget] = useState<"all" | "plan" | "specific">("all")
  const [planType, setPlanType] = useState<string>("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getTargetUserCount = () => {
    if (target === "all") return planCounts.all
    if (target === "plan") {
      if (planType === "free") return planCounts.free
      if (planType === "pro") return planCounts.pro
      if (planType === "premium") return planCounts.premium
    }
    return 0
  }

  const handleSend = async () => {
    // Validation
    if (!title || !message) {
      toast.error("Başlık ve mesaj zorunludur")
      return
    }

    if (target === "plan" && !planType) {
      toast.error("Lütfen bir plan seçin")
      return
    }

    const targetCount = getTargetUserCount()
    if (targetCount === 0) {
      toast.error("Hedef kullanıcı bulunamadı")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          planType: target === "plan" ? planType : undefined,
          title,
          message,
          link: link || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Bildirim gönderilemedi")
      }

      toast.success(data.message || "Bildirimler başarıyla gönderildi")

      // Reset form
      setTitle("")
      setMessage("")
      setLink("")
      setPlanType("")
    } catch (error: any) {
      console.error("Error sending notification:", error)
      toast.error(error.message || "Bildirim gönderilirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Send className="h-5 w-5 text-white/60" />
          Toplu Bildirim Gönder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Selection */}
        <div className="space-y-3">
          <Label className="text-white">Hedef Kullanıcılar</Label>
          <RadioGroup value={target} onValueChange={(value: any) => setTarget(value)}>
            <div className="flex items-center space-x-2 bg-black/20 p-3 rounded-lg border border-white/10">
              <RadioGroupItem value="all" id="all" />
              <label
                htmlFor="all"
                className="flex-1 cursor-pointer flex items-center justify-between"
              >
                <span className="text-white">Tüm Kullanıcılar</span>
                <span className="text-white/60 text-sm">
                  {planCounts.all} kullanıcı
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-2 bg-black/20 p-3 rounded-lg border border-white/10">
              <RadioGroupItem value="plan" id="plan" />
              <label
                htmlFor="plan"
                className="flex-1 cursor-pointer flex items-center justify-between"
              >
                <span className="text-white">Plan Bazlı</span>
                <Users className="h-4 w-4 text-white/60" />
              </label>
            </div>
          </RadioGroup>

          {target === "plan" && (
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Plan seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">
                  Premium ({planCounts.premium} kullanıcı)
                </SelectItem>
                <SelectItem value="pro">
                  Pro ({planCounts.pro} kullanıcı)
                </SelectItem>
                <SelectItem value="free">
                  Free ({planCounts.free} kullanıcı)
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Notification Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Başlık *
            </Label>
            <Input
              id="title"
              placeholder="Bildirim başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">
              Mesaj *
            </Label>
            <Textarea
              id="message"
              placeholder="Bildirim mesajı..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-white">
              Link (Opsiyonel)
            </Label>
            <Input
              id="link"
              placeholder="/uygulama/ana-sayfa"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
            />
            <p className="text-xs text-white/40">
              Bildirime tıklandığında yönlendirilecek sayfa
            </p>
          </div>
        </div>

        {/* Preview */}
        {getTargetUserCount() > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">
                  {getTargetUserCount()} kullanıcıya bildirim gönderilecek
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {target === "all"
                    ? "Tüm kayıtlı kullanıcılara"
                    : target === "plan"
                    ? `${planType.toUpperCase()} planına sahip kullanıcılara`
                    : "Seçili kullanıcılara"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isLoading || !title || !message || (target === "plan" && !planType)}
          className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
        >
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? "Gönderiliyor..." : "Bildirim Gönder"}
        </Button>
      </CardContent>
    </Card>
  )
}
