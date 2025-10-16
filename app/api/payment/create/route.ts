import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const Iyzipay = require("iyzipay")

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { price, cardDetails, billingInfo } = body

    if (!price || !cardDetails) {
      return NextResponse.json(
        { status: "error", message: "price ve cardDetails alanları zorunludur" },
        { status: 400 },
      )
    }

    if (
      !cardDetails.cardHolderName ||
      !cardDetails.cardNumber ||
      !cardDetails.expireMonth ||
      !cardDetails.expireYear ||
      !cardDetails.cvc
    ) {
      return NextResponse.json({ status: "error", message: "Kart bilgileri eksik veya hatalı" }, { status: 400 })
    }

    if (billingInfo) {
      const { error: billingError } = await supabase.from("billing_info").upsert(
        {
          user_id: user.id,
          full_name: billingInfo.fullName,
          email: billingInfo.email,
          phone: billingInfo.phone,
          address: billingInfo.address,
          city: billingInfo.city,
          district: billingInfo.district,
          postal_code: billingInfo.zipCode,
          country: "Türkiye",
          tax_number: billingInfo.taxNumber,
          tax_office: billingInfo.taxOffice,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (billingError) {
        console.error("Billing info save error:", billingError)
      }
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL,
    })

    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `${user.id}_${Date.now()}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: "TRY",
      installment: "1",
      basketId: `B${Date.now()}`,
      paymentChannel: "WEB",
      paymentGroup: "SUBSCRIPTION",
      paymentCard: {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
        expireMonth: cardDetails.expireMonth.toString().padStart(2, "0"),
        expireYear: cardDetails.expireYear.toString(),
        cvc: cardDetails.cvc,
        registerCard: "0",
      },
      buyer: {
        id: user.id,
        name: billingInfo?.fullName?.split(" ")[0] || "Ad",
        surname: billingInfo?.fullName?.split(" ").slice(1).join(" ") || "Soyad",
        email: billingInfo?.email || user.email || "email@email.com",
        identityNumber: billingInfo?.taxNumber || "11111111111",
        registrationAddress: billingInfo?.address || "Adres",
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "85.34.78.112",
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: billingInfo?.fullName || "Ad Soyad",
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
        address: billingInfo?.address || "Adres",
      },
      billingAddress: {
        contactName: billingInfo?.fullName || "Ad Soyad",
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
        address: billingInfo?.address || "Adres",
      },
      basketItems: [
        {
          id: "PREMIUM_SUB",
          name: "Premium Abonelik",
          category1: "Subscription",
          itemType: "VIRTUAL",
          price: price.toString(),
        },
      ],
    }

    console.log("[v0] Sending payment request to Iyzipay...")

    const paymentResult = await new Promise((resolve, reject) => {
      iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          console.error("[v0] Iyzipay error:", err)
          reject(err)
        } else {
          console.log("[v0] Iyzipay result:", result)
          resolve(result)
        }
      })
    })

    const result = paymentResult as any

    if (result.status === "success") {
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

      const { error: subError } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan_type: "premium",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          payment_id: result.paymentId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (subError) {
        console.error("[v0] Subscription update error:", subError)
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        amount: price,
        currency: "TRY",
        payment_method: "credit_card",
        payment_id: result.paymentId,
        status: "success",
        description: "Premium abonelik ödemesi",
      })

      if (paymentError) {
        console.error("[v0] Payment record error:", paymentError)
      }

      return NextResponse.json({
        status: "success",
        paymentId: result.paymentId,
        conversationId: result.conversationId,
        message: "Ödeme başarılı",
      })
    } else {
      console.error("[v0] Payment failed:", result)
      return NextResponse.json(
        {
          status: "error",
          message: result.errorMessage || "Ödeme başarısız",
          errorCode: result.errorCode,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Server error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Sunucu hatası",
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
