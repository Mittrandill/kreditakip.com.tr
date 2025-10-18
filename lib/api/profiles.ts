import { supabase } from '@/lib/supabase'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserProfile {
  id: string
  full_name: string
  theme: ThemePreference
  created_at: string
  updated_at: string
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Update user theme preference
 */
export async function updateUserTheme(
  userId: string,
  theme: ThemePreference
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating theme:', error)
    throw error
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'theme'>>
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}
