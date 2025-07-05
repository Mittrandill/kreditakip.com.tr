"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getCreditCard, updateCreditCard } from "@/lib/api/credit-cards"
import CreditCardTypeSelector from "@/components/credit-card-type-selector"
import type { CreditCardType } from "@/types"

const EditCreditCardForm = () => {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  // Auth kontrolünü kaldırdık, direkt çalışsın
  const user = { id: "user-123" } // Mock user

  const [creditCard, setCreditCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    card_name: "",
    bank_name: "",
    card_type: "",
    cardholder_name: "",
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    credit_limit: 0,
    current_balance: 0,
    due_date: null,
    annual_fee: 0,
    interest_rate: 0,
    status: "active",
    description: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreditCardTypeSelector, setShowCreditCardTypeSelector] = useState(false)
  const [selectedCreditCardType, setSelectedCreditCardType] = useState<CreditCardType | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchCreditCard()
    }
  }, [params.id])

  const fetchCreditCard = async () => {
    try {
      setLoading(true)
      const data = await getCreditCard(params.id as string)
      if (data) {
        setCreditCard(data)
        setFormData({
          card_name: data.card_name || "",
          bank_name: data.bank_name || "",
          card_type: data.card_type || "",
          cardholder_name: data.cardholder_name || "",
          card_number: data.card_number || "",
          expiry_month: data.expiry_month?.toString() || "",
          expiry_year: data.expiry_year?.toString() || "",
          cvv: data.cvv || "",
          credit_limit: data.credit_limit || 0,
          current_balance: data.current_debt || 0,
          due_date: data.due_date || null,
          annual_fee: data.annual_fee || 0,
          interest_rate: data.interest_rate || 0,
          status: data.is_active ? "active" : "inactive",
          description: data.description || "",
        })
      }
    } catch (error) {
      console.error("Error fetching credit card:", error)
      toast({
        title: "Hata",
        description: "Kredi kartı bilgileri yüklenirken hata oluştu",
        variant: "destructive",
      })
      router.push("/uygulama/kredi-kartlari")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.card_name) newErrors.card_name = "Kart adı zorunludur"
    if (!formData.bank_name) newErrors.bank_name = "Banka adı zorunludur"
    if (!formData.card_type) newErrors.card_type = "Kart tipi zorunludur"
    if (!formData.credit_limit) newErrors.credit_limit = "Limit zorunludur"
    if (formData.credit_limit <= 0) newErrors.credit_limit = "Limit 0'dan büyük olmalıdır"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreditCardTypeSelect = (creditCardType: any) => {
    setSelectedCreditCardType(creditCardType)

    // Eşleştirilmiş banka adını kullan
    const bankNameToUse = creditCardType.matched_bank_name || creditCardType.bank_name

    // Segment değerini card_type olarak kullan
    const cardTypeToUse = creditCardType.segment || creditCardType.card_type || "Classic"

    setFormData({
      ...formData,
      card_name: creditCardType.name, // Kart adını da güncelle
      card_type: cardTypeToUse, // Segment değerini card_type olarak kullan
      bank_name: bankNameToUse, // Eşleştirilmiş banka adını kullan
    })

    setShowCreditCardTypeSelector(false)

    // Hataları temizle
    if (errors.bank_name) {
      setErrors({ ...errors, bank_name: "" })
    }
    if (errors.card_name) {
      setErrors({ ...errors, card_name: "" })
    }

    console.log(`✅ Kart türü seçildi ve form güncellendi:`, {
      cardName: creditCardType.name,
      cardType: cardTypeToUse,
      segment: creditCardType.segment,
      originalBank: creditCardType.original_bank_name || creditCardType.bank_name,
      matchedBank: bankNameToUse,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const cardData = {
        card_name: formData.card_name.trim(),
        bank_name: formData.bank_name.trim(),
        card_type: formData.card_type, // Bu değer artık segment'ten geliyor
        cardholder_name: formData.cardholder_name.trim() || undefined,
        card_number: formData.card_number.replace(/\s/g, "") || undefined,
        expiry_month: formData.expiry_month ? Number(formData.expiry_month) : undefined,
        expiry_year: formData.expiry_year ? Number(formData.expiry_year) : undefined,
        cvv: formData.cvv.trim() || undefined,
        credit_limit: Number(formData.credit_limit),
        current_debt: Number(formData.current_balance) || 0,
        due_date: formData.due_date ? Number(formData.due_date) : null,
        annual_fee: Number(formData.annual_fee) || 0,
        interest_rate: Number(formData.interest_rate) || 0,
        is_active: formData.status === "active",
        notes: formData.description.trim(),
      }

      console.log("🔄 Güncellenen kart verisi:", cardData)
      await updateCreditCard(params.id as string, cardData)
      toast({
        title: "Başarılı",
        description: "Kredi kartı başarıyla güncellendi!",
      })
      router.push("/uygulama/kredi-kartlari")
    } catch (error: any) {
      console.error("❌ Kredi kartı güncelleme hatası:", error)
      toast({
        title: "Hata",
        description: "Kredi kartı güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Kredi kartı bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!creditCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kredi Kartı Bulunamadı</h2>
        <p className="text-gray-600 mb-4">Düzenlemek istediğiniz kredi kartı mevcut değil.</p>
        <button
          onClick={() => router.push("/uygulama/kredi-kartlari")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Kredi Kartlarına Dön
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Kredi Kartı Düzenle</h1>

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="card_name" className="block text-gray-700 text-sm font-bold mb-2">
            Kart Adı
          </label>
          <div className="relative">
            <input
              type="text"
              id="card_name"
              name="card_name"
              value={formData.card_name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Kart Adı"
              readOnly
            />
            <button
              type="button"
              onClick={() => setShowCreditCardTypeSelector(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              Seç
            </button>
          </div>
          {errors.card_name && <p className="text-red-500 text-xs italic">{errors.card_name}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="bank_name" className="block text-gray-700 text-sm font-bold mb-2">
            Banka Adı
          </label>
          <input
            type="text"
            id="bank_name"
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Banka Adı"
            readOnly
          />
          {errors.bank_name && <p className="text-red-500 text-xs italic">{errors.bank_name}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="card_type" className="block text-gray-700 text-sm font-bold mb-2">
            Kart Tipi
          </label>
          <input
            type="text"
            id="card_type"
            name="card_type"
            value={formData.card_type}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Kart Tipi"
            readOnly
          />
          {errors.card_type && <p className="text-red-500 text-xs italic">{errors.card_type}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="cardholder_name" className="block text-gray-700 text-sm font-bold mb-2">
            Kart Sahibi Adı
          </label>
          <input
            type="text"
            id="cardholder_name"
            name="cardholder_name"
            value={formData.cardholder_name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Kart Sahibi Adı"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="card_number" className="block text-gray-700 text-sm font-bold mb-2">
            Kart Numarası
          </label>
          <input
            type="text"
            id="card_number"
            name="card_number"
            value={formData.card_number}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Kart Numarası"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="expiry_month" className="block text-gray-700 text-sm font-bold mb-2">
            Son Kullanım Ayı
          </label>
          <input
            type="number"
            id="expiry_month"
            name="expiry_month"
            value={formData.expiry_month}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Son Kullanım Ayı"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="expiry_year" className="block text-gray-700 text-sm font-bold mb-2">
            Son Kullanım Yılı
          </label>
          <input
            type="number"
            id="expiry_year"
            name="expiry_year"
            value={formData.expiry_year}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Son Kullanım Yılı"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="cvv" className="block text-gray-700 text-sm font-bold mb-2">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="CVV"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="credit_limit" className="block text-gray-700 text-sm font-bold mb-2">
            Kredi Limiti
          </label>
          <input
            type="number"
            id="credit_limit"
            name="credit_limit"
            value={formData.credit_limit}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Kredi Limiti"
          />
          {errors.credit_limit && <p className="text-red-500 text-xs italic">{errors.credit_limit}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="current_balance" className="block text-gray-700 text-sm font-bold mb-2">
            Güncel Bakiye
          </label>
          <input
            type="number"
            id="current_balance"
            name="current_balance"
            value={formData.current_balance}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Güncel Bakiye"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="due_date" className="block text-gray-700 text-sm font-bold mb-2">
            Son Ödeme Tarihi
          </label>
          <input
            type="number"
            id="due_date"
            name="due_date"
            value={formData.due_date || ""}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Son Ödeme Tarihi"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="annual_fee" className="block text-gray-700 text-sm font-bold mb-2">
            Yıllık Ücret
          </label>
          <input
            type="number"
            id="annual_fee"
            name="annual_fee"
            value={formData.annual_fee}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Yıllık Ücret"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="interest_rate" className="block text-gray-700 text-sm font-bold mb-2">
            Faiz Oranı
          </label>
          <input
            type="number"
            id="interest_rate"
            name="interest_rate"
            value={formData.interest_rate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Faiz Oranı"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">
            Durum
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Açıklama
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Açıklama"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
          </button>
        </div>
      </form>

      {showCreditCardTypeSelector && (
        <CreditCardTypeSelector
          onSelect={handleCreditCardTypeSelect}
          onClose={() => setShowCreditCardTypeSelector(false)}
        />
      )}
    </div>
  )
}

export default EditCreditCardForm
