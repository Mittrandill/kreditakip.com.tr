"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, CreditCard, Calendar, User, CheckCircle, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { generatePDFReport } from "@/lib/utils/pdf-generator"
import BankLogo from "@/components/bank-logo"

interface PDFReportModalProps {
  userData: {
    credits: Array<{
      id: string
      bankName?: string
      creditType?: string
      remainingDebt?: number
      monthlyPayment?: number
      interestRate?: number
      status?: string
      banks?: { name?: string; logo_url?: string | null } | null
      credit_types?: { name?: string } | null
    }>
    payments: Array<{
      id: string
      date: string
      bankName?: string
      amount?: number
      status?: string
    }>
    creditCards: Array<any>
    summary: {
      name: string
      email: string
    }
  }
  trigger: React.ReactNode
}

export default function PDFReportModal({ userData, trigger }: PDFReportModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedCredits, setSelectedCredits] = useState<string[]>([])
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [selectedCreditCards, setSelectedCreditCards] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCreditToggle = (creditId: string) => {
    setSelectedCredits((prev) => (prev.includes(creditId) ? prev.filter((id) => id !== creditId) : [...prev, creditId]))
  }

  const handlePaymentToggle = (paymentId: string) => {
    setSelectedPayments((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId],
    )
  }

  const handleCreditCardToggle = (cardId: string) => {
    setSelectedCreditCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const handleSelectAllCredits = () => {
    if (selectedCredits.length === userData.credits.length) {
      setSelectedCredits([])
    } else {
      setSelectedCredits(userData.credits.map((c) => c.id))
    }
  }

  const handleSelectAllPayments = () => {
    if (selectedPayments.length === userData.payments.length) {
      setSelectedPayments([])
    } else {
      setSelectedPayments(userData.payments.map((p) => p.id))
    }
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const selectedData = {
        credits: userData.credits.filter((c) => selectedCredits.includes(c.id)),
        payments: userData.payments.filter((p) => selectedPayments.includes(p.id)),
        creditCards: userData.creditCards.filter((c) => selectedCreditCards.includes(c.id)),
        summary: userData.summary,
      }

      await generatePDFReport(selectedData)
      setOpen(false)
    } catch (error) {
      console.error("PDF generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const totalSelectedItems = selectedCredits.length + selectedPayments.length + selectedCreditCards.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            PDF Rapor Oluştur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Kullanıcı Bilgileri */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Rapor Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Ad Soyad</Label>
                  <p className="font-medium">{userData.summary.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">E-posta</Label>
                  <p className="font-medium">{userData.summary.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Krediler */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    Krediler ({userData.credits.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleSelectAllCredits}>
                    {selectedCredits.length === userData.credits.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userData.credits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`credit-${credit.id}`}
                          checked={selectedCredits.includes(credit.id)}
                          onCheckedChange={() => handleCreditToggle(credit.id)}
                        />
                        <BankLogo
                          bankName={credit.banks?.name || credit.bankName || ""}
                          logoUrl={credit.banks?.logo_url}
                          size="sm"
                        />
                        <div>
                          <Label htmlFor={`credit-${credit.id}`} className="font-medium cursor-pointer">
                            {credit.banks?.name || credit.bankName}
                          </Label>
                          <p className="text-xs text-gray-500">{credit.credit_types?.name || credit.creditType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(credit.remainingDebt || 0)}</p>
                        <p className="text-xs text-gray-500">%{credit.interestRate?.toFixed(1) || 0} faiz</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ödemeler */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Ödemeler ({userData.payments.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleSelectAllPayments}>
                    {selectedPayments.length === userData.payments.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userData.payments.slice(0, 10).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`payment-${payment.id}`}
                          checked={selectedPayments.includes(payment.id)}
                          onCheckedChange={() => handlePaymentToggle(payment.id)}
                        />
                        <div>
                          <Label htmlFor={`payment-${payment.id}`} className="font-medium cursor-pointer">
                            {payment.bankName || "Ödeme"}
                          </Label>
                          <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(payment.amount || 0)}</p>
                        <Badge variant={payment.status === "paid" ? "default" : "destructive"} className="text-xs">
                          {payment.status === "paid" ? "Ödendi" : "Bekliyor"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Özet */}
          <Card className="bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                Rapor Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{selectedCredits.length}</div>
                  <div className="text-sm text-gray-600">Seçili Kredi</div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedPayments.length}</div>
                  <div className="text-sm text-gray-600">Seçili Ödeme</div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalSelectedItems}</div>
                  <div className="text-sm text-gray-600">Toplam Öğe</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
              İptal
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={totalSelectedItems === 0 || isGenerating}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  PDF İndir ({totalSelectedItems} öğe)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
