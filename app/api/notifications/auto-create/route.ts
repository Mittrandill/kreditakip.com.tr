import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { user_id, message, type, link } = await request.json()

    if (!user_id || !message || !type) {
      return new NextResponse(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id,
          message,
          type,
          link,
          read: false,
        },
      ])
      .select()

    if (error) {
      return new NextResponse(JSON.stringify({ message: "Failed to create notification", error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new NextResponse(JSON.stringify({ message: "Notification created successfully", data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ message: "Internal server error", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
