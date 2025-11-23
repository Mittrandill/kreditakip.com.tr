"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreditCard, Trash2, Star, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SavedCard {
  id: string
  last_4: string
  card_holder_name: string
  expiry_month: string
  expiry_year: string
  bank_name?: string
  card_brand?: string
  card_type?: string
  is_default: boolean
  is_active: boolean
}

interface SavedCardsProps {
  cards: SavedCard[]
  onUpdate: () => void
}

export function SavedCards({ cards, onUpdate }: SavedCardsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  const handleDeleteCard = async (cardId: string) => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/payment/cards/${cardId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Kart Silindi",
          description: "Kart başarıyla silindi.",
        })
        onUpdate()
      } else {
        toast({
          title: "Hata",
          description: data.error || "Kart silinirken hata oluştu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete card error:", error)
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteCardId(null)
    }
  }

  const handleSetDefault = async (cardId: string) => {
    setSettingDefaultId(cardId)

    try {
      const response = await fetch("/api/payment/cards/set-default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Varsayılan Kart Güncellendi",
          description: "Varsayılan kart başarıyla değiştirildi.",
        })
        onUpdate()
      } else {
        toast({
          title: "Hata",
          description: data.error || "Varsayılan kart güncellenirken hata oluştu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Set default card error:", error)
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kayıtlı Kartlar</CardTitle>
              <CardDescription>Ödeme için kayıtlı kartlarınızı yönetin</CardDescription>
            </div>
            <Button onClick={() => router.push("/uygulama/premium")} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kart Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Henüz kayıtlı kartınız yok</p>
              <Button onClick={() => router.push("/uygulama/premium")} variant="outline">
                İlk Kartınızı Ekleyin
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">•••• •••• •••• {card.last_4}</p>
                        {card.is_default && (
                          <Badge className="bg-emerald-600 dark:bg-emerald-500">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Varsayılan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {card.card_holder_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Son kullanma: {card.expiry_month}/{card.expiry_year}
                        {card.bank_name && ` • ${card.bank_name}`}
                        {card.card_brand && ` • ${card.card_brand}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!card.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={settingDefaultId === card.id}
                      >
                        {settingDefaultId === card.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                            Ayarlanıyor...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Varsayılan Yap
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteCardId(card.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCardId !== null} onOpenChange={() => setDeleteCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kartı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kartı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCardId && handleDeleteCard(deleteCardId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
