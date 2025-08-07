import { supabase } from "@/lib/supabase"
import { encryptSensitiveData, decryptSensitiveData, maskCardNumber } from "@/lib/utils/encryption"

export interface CreateCreditCardData {
  card_name: string
  bank_name: string
  card_type: string
  cardholder_name?: string
  card_number?: string
  expiry_month?: number
  expiry_year?: number
  cvv?: string
  credit_limit: number
  current_balance: number
  due_date?: number | null
  annual_fee: number
  interest_rate: number
  status: string
  description: string
}

export interface UpdateCreditCardData {
  card_name?: string
  bank_name?: string
  card_type?: string
  cardholder_name?: string
  card_number?: string
  expiry_month?: number
  expiry_year?: number
  cvv?: string
  credit_limit?: number
  current_debt?: number
  due_date?: number | null
  annual_fee?: number
  interest_rate?: number
  minimum_payment_rate?: number
  late_payment_fee?: number
  is_active?: boolean
  notes?: string
}

export interface CreditCard {
  id: string
  user_id: string
  card_name: string
  bank_name: string
  card_type: string
  cardholder_name?: string
  card_number?: string
  card_number_masked?: string
  expiry_month?: number
  expiry_year?: number
  cvv?: string
  credit_limit: number
  current_debt: number
  available_limit: number
  utilization_rate: number
  due_date?: number | null
  annual_fee: number
  interest_rate: number
  minimum_payment_rate: number
  status: string
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
  banks?: {
    id: string
    name: string
    logo_url: string | null
  }
}

export async function createCreditCard(userId: string, data: CreateCreditCardData): Promise<CreditCard> {
  try {

    // Banka bul veya oluştur
    let bankId = null
    if (data.bank_name) {
      const { data: existingBank } = await supabase.from("banks").select("id").ilike("name", data.bank_name).single()

      if (existingBank) {
        bankId = existingBank.id
        // // console.log("✅ Mevcut banka bulundu:", data.bank_name)
      } else {
        const { data: newBank, error: bankError } = await supabase
          .from("banks")
          .insert({
            name: data.bank_name,
            is_active: true,
          })
          .select("id")
          .single()

        if (bankError) {
          // // console.error("❌ Banka oluşturma hatası:", bankError)
        } else {
          bankId = newBank.id
          // // console.log("✅ Yeni banka oluşturuldu:", data.bank_name)
        }
      }
    }

    // Kart türü eşleştirmesi - credit_card_types tablosundan al
    let finalCardType = data.card_type || "Classic"

    if (data.card_type && data.bank_name) {
      const { data: cardTypeData } = await supabase
        .from("credit_card_types")
        .select("card_type, segment, category")
        .ilike("bank_name", data.bank_name)
        .ilike("name", `%${data.card_type}%`)
        .eq("is_active", true)
        .single()

      if (cardTypeData) {
        // Segment değerini öncelikle kullan, yoksa card_type kullan
        finalCardType = cardTypeData.segment || cardTypeData.card_type || data.card_type
      } else {
        // Eşleşme bulunamazsa gelen değeri kullan
        finalCardType = data.card_type
        // // console.log("ℹ️ Kart türü eşleştirmesi bulunamadı, orijinal değer kullanılıyor:", finalCardType)
      }
    }

    // // console.log("🎯 Final kart türü:", finalCardType)

    // Veritabanı şemasına uygun veri yapısı
    const cardData: any = {
      user_id: userId,
      card_name: data.card_name,
      bank_id: bankId,
      bank_name: data.bank_name,
      card_type: finalCardType, // Eşleştirilmiş kart türü
      credit_limit: data.credit_limit,
      current_debt: data.current_balance,
      minimum_payment_rate: 3, // Varsayılan %3
      annual_fee: data.annual_fee,
      interest_rate: data.interest_rate,
      status: data.status,
      is_active: data.status === "aktif",
      description: data.description || null,
    }

    // due_date sadece sağlanmışsa ekle
    if (data.due_date !== undefined && data.due_date !== null) {
      cardData.due_date = data.due_date
    }

    // Hassas verileri şifrele
    if (data.cardholder_name) {
      try {
        cardData.cardholder_name_encrypted = encryptSensitiveData(data.cardholder_name)
        // // console.log("🔒 Kart sahibi adı şifrelendi")
      } catch (error) {
        // // console.error("❌ Kart sahibi adı şifreleme hatası:", error)
        throw new Error("Kart sahibi adı şifrelenemedi")
      }
    }

    if (data.card_number) {
      try {
        cardData.card_number_encrypted = encryptSensitiveData(data.card_number)
        // // console.log("🔒 Kart numarası şifrelendi")
      } catch (error) {
        // // console.error("❌ Kart numarası şifreleme hatası:", error)
        throw new Error("Kart numarası şifrelenemedi")
      }
    }

    if (data.expiry_month) {
      try {
        cardData.expiry_month_encrypted = encryptSensitiveData(data.expiry_month.toString())
        // // console.log("🔒 Son kullanma ayı şifrelendi")
      } catch (error) {
        // // console.error("❌ Son kullanma ayı şifreleme hatası:", error)
        throw new Error("Son kullanma ayı şifrelenemedi")
      }
    }

    if (data.expiry_year) {
      try {
        cardData.expiry_year_encrypted = encryptSensitiveData(data.expiry_year.toString())
        // // console.log("🔒 Son kullanma yılı şifrelendi")
      } catch (error) {
        // // console.error("❌ Son kullanma yılı şifreleme hatası:", error)
        throw new Error("Son kullanma yılı şifrelenemedi")
      }
    }

    if (data.cvv) {
      try {
        cardData.cvv_encrypted = encryptSensitiveData(data.cvv)
        // // console.log("🔒 CVV şifrelendi")
      } catch (error) {
        // // console.error("❌ CVV şifreleme hatası:", error)
        throw new Error("CVV şifrelenemedi")
      }
    }


    const { data: creditCard, error } = await supabase.from("credit_cards").insert(cardData).select().single()

    if (error) {
      // // console.error("❌ Kredi kartı oluşturma hatası:", error)
      throw new Error(`Kredi kartı oluşturulamadı: ${error.message}`)
    }

    // // console.log("✅ Kredi kartı başarıyla oluşturuldu:", creditCard.id)
    return await processCreditCardData(creditCard)
  } catch (error) {
    // // console.error("❌ createCreditCard hatası:", error)
    throw error
  }
}

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  try {
    // // console.log("🔄 Kullanıcı kredi kartları getiriliyor:", userId)

    const { data: creditCards, error } = await supabase
      .from("credit_cards")
      .select(`
        *,
        banks (
          id,
          name,
          logo_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // // console.error("❌ Kredi kartları getirme hatası:", error)
      throw new Error(`Kredi kartları getirilemedi: ${error.message}`)
    }

    if (!creditCards) {
      // // console.log("ℹ️ Kredi kartı bulunamadı")
      return []
    }

    // // console.log(`✅ ${creditCards.length} kredi kartı bulundu`)

    // Her kredi kartını işle ve hassas verileri çöz
    const processedCards = await Promise.all(creditCards.map((card) => processCreditCardData(card)))

    return processedCards
  } catch (error) {
    // // console.error("❌ getCreditCards hatası:", error)
    throw error
  }
}

export async function getCreditCard(cardId: string): Promise<CreditCard | null> {
  try {
    // // console.log("🔄 Kredi kartı detayı getiriliyor:", cardId)

    const { data: creditCard, error } = await supabase
      .from("credit_cards")
      .select(`
        *,
        banks (
          id,
          name,
          logo_url
        )
      `)
      .eq("id", cardId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // // console.log("ℹ️ Kredi kartı bulunamadı:", cardId)
        return null
      }
      // // console.error("❌ Kredi kartı getirme hatası:", error)
      throw new Error(`Kredi kartı getirilemedi: ${error.message}`)
    }

    // // console.log("✅ Kredi kartı bulundu:", creditCard.card_name)
    return await processCreditCardData(creditCard)
  } catch (error) {
    // // console.error("❌ getCreditCard hatası:", error)
    throw error
  }
}

export async function updateCreditCard(cardId: string, data: UpdateCreditCardData): Promise<CreditCard> {
  try {
    // // console.log("🔄 Kredi kartı güncelleniyor:", cardId)

    // Banka bul veya oluştur
    let bankId = undefined
    if (data.bank_name) {
      const { data: existingBank } = await supabase.from("banks").select("id").ilike("name", data.bank_name).single()

      if (existingBank) {
        bankId = existingBank.id
      } else {
        const { data: newBank, error: bankError } = await supabase
          .from("banks")
          .insert({
            name: data.bank_name,
            is_active: true,
          })
          .select("id")
          .single()

        if (bankError) {
          // // console.error("❌ Banka oluşturma hatası:", bankError)
        } else {
          bankId = newBank.id
        }
      }
    }

    // Güncelleme verisi hazırla
    const updateData: any = {}

    // Şifrelenmemiş alanlar
    if (data.card_name !== undefined) updateData.card_name = data.card_name
    if (data.bank_name !== undefined) updateData.bank_name = data.bank_name
    if (bankId !== undefined) updateData.bank_id = bankId
    if (data.card_type !== undefined) updateData.card_type = data.card_type
    if (data.credit_limit !== undefined) updateData.credit_limit = data.credit_limit
    if (data.current_debt !== undefined) updateData.current_debt = data.current_debt
    if (data.due_date !== undefined) updateData.due_date = data.due_date
    if (data.annual_fee !== undefined) updateData.annual_fee = data.annual_fee
    if (data.interest_rate !== undefined) updateData.interest_rate = data.interest_rate
    if (data.minimum_payment_rate !== undefined) updateData.minimum_payment_rate = data.minimum_payment_rate
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.notes !== undefined) updateData.description = data.notes

    // Şifreli alanları güncelle
    if (data.cardholder_name !== undefined) {
      try {
        updateData.cardholder_name_encrypted = data.cardholder_name ? encryptSensitiveData(data.cardholder_name) : null
        // // console.log("🔒 Kart sahibi adı güncellendi ve şifrelendi")
      } catch (error) {
        // // console.error("❌ Kart sahibi adı şifreleme hatası:", error)
        throw new Error("Kart sahibi adı şifrelenemedi")
      }
    }

    if (data.card_number !== undefined) {
      try {
        updateData.card_number_encrypted = data.card_number ? encryptSensitiveData(data.card_number) : null
        // // console.log("🔒 Kart numarası güncellendi ve şifrelendi")
      } catch (error) {
        // // console.error("❌ Kart numarası şifreleme hatası:", error)
        throw new Error("Kart numarası şifrelenemedi")
      }
    }

    if (data.expiry_month !== undefined) {
      try {
        updateData.expiry_month_encrypted = data.expiry_month
          ? encryptSensitiveData(data.expiry_month.toString())
          : null
        // // console.log("🔒 Son kullanma ayı güncellendi ve şifrelendi")
      } catch (error) {
        // // console.error("❌ Son kullanma ayı şifreleme hatası:", error)
        throw new Error("Son kullanma ayı şifrelenemedi")
      }
    }

    if (data.expiry_year !== undefined) {
      try {
        updateData.expiry_year_encrypted = data.expiry_year ? encryptSensitiveData(data.expiry_year.toString()) : null
        // // console.log("🔒 Son kullanma yılı güncellendi ve şifrelendi")
      } catch (error) {
        // // console.error("❌ Son kullanma yılı şifreleme hatası:", error)
        throw new Error("Son kullanma yılı şifrelenemedi")
      }
    }

    if (data.cvv !== undefined) {
      try {
        updateData.cvv_encrypted = data.cvv ? encryptSensitiveData(data.cvv) : null
        // // console.log("🔒 CVV güncellendi ve şifrelendi")
      } catch (error) {
        // // console.error("❌ CVV şifreleme hatası:", error)
        throw new Error("CVV şifrelenemedi")
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data: creditCard, error } = await supabase
      .from("credit_cards")
      .update(updateData)
      .eq("id", cardId)
      .select(`
        *,
        banks (
          id,
          name,
          logo_url
        )
      `)
      .single()

    if (error) {
      // // console.error("❌ Kredi kartı güncelleme hatası:", error)
      throw new Error(`Kredi kartı güncellenemedi: ${error.message}`)
    }

    // // console.log("✅ Kredi kartı başarıyla güncellendi")
    return await processCreditCardData(creditCard)
  } catch (error) {
    // // console.error("❌ updateCreditCard hatası:", error)
    throw error
  }
}

export async function deleteCreditCard(cardId: string): Promise<void> {
  try {
    // // console.log("🔄 Kredi kartı siliniyor:", cardId)

    const { error } = await supabase.from("credit_cards").delete().eq("id", cardId)

    if (error) {
      // // console.error("❌ Kredi kartı silme hatası:", error)
      throw new Error(`Kredi kartı silinemedi: ${error.message}`)
    }

    // // console.log("✅ Kredi kartı başarıyla silindi")
  } catch (error) {
    // // console.error("❌ deleteCreditCard hatası:", error)
    throw error
  }
}

// Kredi kartı verisini işle (şifre çöz ve hesapla)
async function processCreditCardData(card: any): Promise<CreditCard> {
  try {

    // Hassas verileri çöz
    let cardholder_name: string | undefined
    let card_number: string | undefined
    let expiry_month: number | undefined
    let expiry_year: number | undefined
    let cvv: string | undefined

    // Kart sahibi adını çöz
    if (card.cardholder_name_encrypted) {
      try {
        cardholder_name = decryptSensitiveData(card.cardholder_name_encrypted)
        // // console.log("🔓 Kart sahibi adı çözüldü")
      } catch (error) {
        // // console.error("❌ Kart sahibi adı çözme hatası:", error)
        cardholder_name = card.cardholder_name // Fallback
      }
    } else {
      cardholder_name = card.cardholder_name
    }

    // Kart numarasını çöz
    if (card.card_number_encrypted) {
      try {
        card_number = decryptSensitiveData(card.card_number_encrypted)
        // // console.log("🔓 Kart numarası çözüldü")
      } catch (error) {
        // // console.error("❌ Kart numarası çözme hatası:", error)
        card_number = card.card_number // Fallback
      }
    } else {
      card_number = card.card_number
    }

    // Son kullanma ayını çöz
    if (card.expiry_month_encrypted) {
      try {
        const decryptedMonth = decryptSensitiveData(card.expiry_month_encrypted)
        expiry_month = decryptedMonth ? Number.parseInt(decryptedMonth, 10) : undefined
        // // console.log("🔓 Son kullanma ayı çözüldü")
      } catch (error) {
        // // console.error("❌ Son kullanma ayı çözme hatası:", error)
        expiry_month = card.expiry_month // Fallback
      }
    } else {
      expiry_month = card.expiry_month
    }

    // Son kullanma yılını çöz
    if (card.expiry_year_encrypted) {
      try {
        const decryptedYear = decryptSensitiveData(card.expiry_year_encrypted)
        expiry_year = decryptedYear ? Number.parseInt(decryptedYear, 10) : undefined
        // // console.log("🔓 Son kullanma yılı çözüldü")
      } catch (error) {
        // // console.error("❌ Son kullanma yılı çözme hatası:", error)
        expiry_year = card.expiry_year // Fallback
      }
    } else {
      expiry_year = card.expiry_year
    }

    // CVV'yi çöz
    if (card.cvv_encrypted) {
      try {
        cvv = decryptSensitiveData(card.cvv_encrypted)
        // // console.log("🔓 CVV çözüldü")
      } catch (error) {
        // // console.error("❌ CVV çözme hatası:", error)
        cvv = card.cvv // Fallback
      }
    } else {
      cvv = card.cvv
    }

    // Hesaplanmış alanlar
    const current_debt = card.current_debt || 0
    const credit_limit = card.credit_limit || 0
    const available_limit = card.available_limit || credit_limit - current_debt
    const utilization_rate = credit_limit > 0 ? (current_debt / credit_limit) * 100 : 0

    const processedCard: CreditCard = {
      id: card.id,
      user_id: card.user_id,
      card_name: card.card_name,
      bank_name: card.bank_name || card.banks?.name || "Bilinmeyen Banka",
      card_type: card.card_type, // Doğru kart türü korunuyor
      cardholder_name,
      card_number,
      card_number_masked: card_number ? maskCardNumber(card_number) : undefined,
      expiry_month,
      expiry_year,
      cvv,
      credit_limit,
      current_debt,
      available_limit,
      utilization_rate,
      due_date: card.due_date,
      annual_fee: card.annual_fee || 0,
      interest_rate: card.interest_rate || 0,
      minimum_payment_rate: card.minimum_payment_rate || 3,
      status: card.status,
      is_active: card.is_active,
      description: card.description,
      created_at: card.created_at,
      updated_at: card.updated_at,
      banks: card.banks,
    }


    return processedCard
  } catch (error) {
    // // console.error("❌ Kart verisi işleme hatası:", error)
    throw error
  }
}

// Özet bilgiler
export async function getCreditCardSummary(userId: string) {
  try {
    const creditCards = await getCreditCards(userId)

    const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0)
    const totalCurrentDebt = creditCards.reduce((sum, card) => sum + card.current_debt, 0)
    const totalAvailableLimit = totalCreditLimit - totalCurrentDebt
    const averageUtilizationRate =
      creditCards.length > 0
        ? creditCards.reduce((sum, card) => sum + card.utilization_rate, 0) / creditCards.length
        : 0

    return {
      totalCards: creditCards.length,
      totalCreditLimit,
      totalCurrentDebt,
      totalAvailableLimit,
      averageUtilizationRate,
      activeCards: creditCards.filter((card) => card.is_active).length,
      cards: creditCards,
    }
  } catch (error) {
    // // console.error("❌ getCreditCardSummary hatası:", error)
    throw error
  }
}

// Yaklaşan son ödeme tarihleri
export async function getUpcomingDueDates(userId: string, daysAhead = 30) {
  try {
    const today = new Date()
    const target = new Date()
    target.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from("credit_cards")
      .select(`
        id,
        card_name,
        card_number_encrypted,
        bank_name,
        minimum_payment_rate,
        credit_limit,
        current_debt,
        next_due_date
      `)
      .eq("user_id", userId)
      .gte("next_due_date", today.toISOString())
      .lte("next_due_date", target.toISOString())
      .order("next_due_date", { ascending: true })

    if (error) {
      // // console.error("❌ Yaklaşan son ödeme tarihleri hatası:", error)
      throw new Error("Yaklaşan son ödeme tarihleri yüklenirken hata oluştu")
    }

    // Minimum ödeme hesapla ve kart numarasını maskele
    return (data || []).map((card) => {
      let card_number_masked = "**** **** **** ****"

      // Şifreli kart numarasını çöz ve maskele
      if (card.card_number_encrypted) {
        try {
          const decrypted = decryptSensitiveData(card.card_number_encrypted)
          card_number_masked = maskCardNumber(decrypted)
        } catch (error) {
          // // console.error("❌ Kart numarası çözme hatası (due dates):", error)
        }
      }

      return {
        ...card,
        card_number_masked,
        minimumPayment: ((card.current_debt || 0) * (card.minimum_payment_rate || 0)) / 100,
      }
    })
  } catch (error) {
    // // console.error("❌ getUpcomingDueDates hatası:", error)
    throw error
  }
}
