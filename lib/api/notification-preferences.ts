import { supabase } from "@/lib/supabase"

export interface NotificationPreferences {
  id: string
  user_id: string
  email_3_days_before: boolean
  email_1_day_before: boolean
  email_on_due_date: boolean
  email_overdue: boolean
  sms_1_day_before: boolean
  sms_on_due_date: boolean
  email_enabled: boolean
  sms_enabled: boolean
  notification_time: string
  created_at: string
  updated_at: string
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No row found, create default preferences
      return await createDefaultNotificationPreferences(userId)
    }
    console.error("Error fetching notification preferences:", error)
    throw error
  }

  return data
}

export async function createDefaultNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .insert({
      user_id: userId,
      email_3_days_before: true,
      email_1_day_before: true,
      email_on_due_date: true,
      email_overdue: true,
      sms_1_day_before: false,
      sms_on_due_date: false,
      email_enabled: true,
      sms_enabled: false,
      notification_time: "09:00:00",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating default notification preferences:", error)
    throw error
  }

  return data
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .update(preferences)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating notification preferences:", error)
    throw error
  }

  return data
}

export async function toggleNotificationPreference(
  userId: string,
  field: keyof Pick<
    NotificationPreferences,
    | "email_3_days_before"
    | "email_1_day_before"
    | "email_on_due_date"
    | "email_overdue"
    | "sms_1_day_before"
    | "sms_on_due_date"
    | "email_enabled"
    | "sms_enabled"
  >,
  value: boolean,
): Promise<NotificationPreferences> {
  return await updateNotificationPreferences(userId, { [field]: value })
}
