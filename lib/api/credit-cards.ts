import { supabase } from '@/lib/supabase'
import type { CreditCard } from '@/lib/types'

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  try {
    const { data, error } = await supabase
      .from('credit_cards')
      .select(`
        *,
        banks (
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching credit cards:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getCreditCards:', error)
    throw error
  }
}

export async function getCreditCard(id: string): Promise<CreditCard | null> {
  try {
    const { data, error } = await supabase
      .from('credit_cards')
      .select(`
        *,
        banks (
          id,
          name,
          logo_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching credit card:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getCreditCard:', error)
    throw error
  }
}

export async function createCreditCard(creditCard: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>): Promise<CreditCard> {
  try {
    const { data, error } = await supabase
      .from('credit_cards')
      .insert([creditCard])
      .select()
      .single()

    if (error) {
      console.error('Error creating credit card:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createCreditCard:', error)
    throw error
  }
}

export async function updateCreditCard(id: string, updates: Partial<CreditCard>): Promise<CreditCard> {
  try {
    const { data, error } = await supabase
      .from('credit_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating credit card:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateCreditCard:', error)
    throw error
  }
}

export async function deleteCreditCard(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting credit card:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteCreditCard:', error)
    throw error
  }
}

export async function getCreditCardSummary(userId: string) {
  try {
    const creditCards = await getCreditCards(userId)
    
    const activeCards = creditCards.filter(card => card.is_active)
    
    const summary = {
      totalCards: creditCards.length,
      activeCards: activeCards.length,
      totalCreditLimit: activeCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0),
      totalCurrentDebt: activeCards.reduce((sum, card) => sum + (card.current_debt || 0), 0),
      totalAvailableLimit: activeCards.reduce((sum, card) => sum + ((card.credit_limit || 0) - (card.current_debt || 0)), 0),
      averageUtilizationRate: activeCards.length > 0 
        ? activeCards.reduce((sum, card) => {
            const utilization = card.credit_limit > 0 ? (card.current_debt / card.credit_limit) * 100 : 0
            return sum + utilization
          }, 0) / activeCards.length
        : 0
    }

    return summary
  } catch (error) {
    console.error('Error in getCreditCardSummary:', error)
    throw error
  }
}

export async function getCreditCardTypes() {
  return [
    { value: 'kredi', label: 'Kredi Kartı' },
    { value: 'bankakarti', label: 'Banka Kartı' },
    { value: 'prepaid', label: 'Prepaid Kart' }
  ]
}
