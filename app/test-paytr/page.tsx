"use client"

import { useState } from "react"
import PayTRCardForm from "@/components/paytr-card-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPayTRPage() {
  const [testUser] = useState({
    id: "test-user-123",
    email: "test@example.com",
  })

  const [selectedPlan, setSelectedPlan] = useState({
    id: "premium-monthly",
    name: "Premium Monthly",
    price: 399,
  })

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <h1 className="text-4xl font-bold mb-2">PayTR Direkt API Test</h1>
      <p className="text-muted-foreground mb-8">Test kartı ile ödeme yapabilirsiniz</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Plan Selection */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Plan Seçin</h2>

          <Tabs defaultValue="premium-monthly" className="w-full" onValueChange={(value) => {
            const plans: Record<string, { name: string; price: number }> = {
              "pro-monthly": { name: "Pro Monthly", price: 199 },
              "pro-yearly": { name: "Pro Yearly", price: 1910 },
              "premium-monthly": { name: "Premium Monthly", price: 399 },
              "premium-yearly": { name: "Premium Yearly", price: 3830 },
            }
            setSelectedPlan({ id: value, ...plans[value] })
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="premium-monthly">Premium Aylık</TabsTrigger>
              <TabsTrigger value="premium-yearly">Premium Yıllık</TabsTrigger>
            </TabsList>

            <TabsContent value="premium-monthly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Monthly</CardTitle>
                  <CardDescription>Aylık 399 TL</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Sınırsız OCR analizi</li>
                    <li>✓ Sınırsız Risk analizi</li>
                    <li>✓ Premium badge</li>
                    <li>✓ Öncelikli destek</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="premium-yearly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Yearly</CardTitle>
                  <CardDescription>Yıllık 3830 TL (%20 indirim)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Sınırsız OCR analizi</li>
                    <li>✓ Sınırsız Risk analizi</li>
                    <li>✓ Premium badge</li>
                    <li>✓ Öncelikli destek</li>
                    <li>✓ %20 indirim</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="pro-monthly">Pro Aylık</TabsTrigger>
              <TabsTrigger value="pro-yearly">Pro Yıllık</TabsTrigger>
            </TabsList>

            <TabsContent value="pro-monthly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pro Monthly</CardTitle>
                  <CardDescription>Aylık 199 TL</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 10 OCR analizi</li>
                    <li>✓ 5 Risk analizi</li>
                    <li>✓ Gelişmiş raporlar</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pro-yearly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pro Yearly</CardTitle>
                  <CardDescription>Yıllık 1910 TL (%20 indirim)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 10 OCR analizi (aylık)</li>
                    <li>✓ 5 Risk analizi (aylık)</li>
                    <li>✓ Gelişmiş raporlar</li>
                    <li>✓ %20 indirim</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Card Form */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Ödeme Bilgileri</h2>

          <PayTRCardForm
            planId={selectedPlan.id}
            planName={selectedPlan.name}
            price={selectedPlan.price}
            userId={testUser.id}
            userEmail={testUser.email}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Test Bilgileri</h2>
        <div className="space-y-1 text-sm">
          <p><strong>User ID:</strong> {testUser.id}</p>
          <p><strong>Email:</strong> {testUser.email}</p>
          <p><strong>Ngrok URL:</strong> {process.env.NEXT_PUBLIC_APP_URL}</p>
          <p><strong>Callback URL:</strong> {process.env.NEXT_PUBLIC_APP_URL}/api/paytr/callback</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">PayTR Test Kartları (Production Mode):</h3>
          <div className="text-sm space-y-2">
            <div>
              <p className="font-semibold">Kart 1 (Başarılı):</p>
              <p>Kart No: 9792 0303 9444 0796</p>
              <p>CVV: 000</p>
              <p>Son Kullanma: 12/30</p>
              <p>3D Secure Şifre: a</p>
            </div>
            <div>
              <p className="font-semibold">Kart 2 (Başarılı):</p>
              <p>Kart No: 4355 0843 5508 4358</p>
            </div>
            <div>
              <p className="font-semibold">Kart 3 (Başarılı):</p>
              <p>Kart No: 540667</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
