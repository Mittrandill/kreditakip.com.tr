import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const Iyzipay = require("iyzipay")

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Payment API called")

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const body = await request.json()
    const { price, cardDetails, billingInfo } = body

    console.log("[v0] Request body:", { price, hasBillingInfo: !!billingInfo, hasCardDetails: !!cardDetails })

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
      console.log("[v0] Saving billing info")
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
        console.error("[v0] Billing info save error:", billingError)
      } else {
        console.log("[v0] Billing info saved successfully")
      }
    }

    console.log("[v0] Initializing iyzipay")
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL,
    })

    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "85.34.78.112"

    const nameParts = (billingInfo?.fullName || "Ad Soyad").split(" ")
    const firstName = nameParts[0] || "Ad"
    const lastName = nameParts.slice(1).join(" ") || "Soyad"

    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `${user.id}_${Date.now()}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: "1",
      basketId: `B${Date.now()}`,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: cardDetails.cardHolderName,
        cardNumber: cardDetails.cardNumber.replace(/\s/g, ""),
        expireMonth: cardDetails.expireMonth.toString().padStart(2, "0"),
        expireYear: cardDetails.expireYear.toString(),
        cvc: cardDetails.cvc,
        registerCard: "0",
      },
      buyer: {
        id: user.id.substring(0, 11),
        name: firstName,
        surname: lastName,
        gsmNumber: billingInfo?.phone || "+905350000000",
        email: billingInfo?.email || user.email || "email@email.com",
        identityNumber: "11111111111", // Use valid 11-digit TC identity number
        lastLoginDate: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().split(" ")[0],
        registrationDate: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().split(" ")[0],
        registrationAddress: billingInfo?.address || "Adres Bilgisi",
        ip: userIp,
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
        zipCode: billingInfo?.zipCode || "34000",
      },
      shippingAddress: {
        contactName: billingInfo?.fullName || "Ad Soyad",
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
        address: billingInfo?.address || "Adres Bilgisi",
        zipCode: billingInfo?.zipCode || "34000",
      },
      billingAddress: {
        contactName: billingInfo?.fullName || "Ad Soyad",
        city: billingInfo?.city || "Istanbul",
        country: "Turkey",
        address: billingInfo?.address || "Adres Bilgisi",
        zipCode: billingInfo?.zipCode || "34000",
      },
      basketItems: [
        {
          id: "PREMIUM_SUB",
          name: "Premium Abonelik",
          category1: "Subscription",
          category2: "Monthly",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: price.toString(),
        },
      ],
    }

    console.log("[v0] Sending payment request to iyzipay")
    console.log("[v0] Payment request:", JSON.stringify(paymentRequest, null, 2))

    const paymentResult: any = await new Promise((resolve, reject) => {
      iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
        if (err) {
          console.error("[v0] Iyzipay callback error:", err)
          reject(err)
        } else {
          console.log("[v0] Iyzipay callback result:", JSON.stringify(result, null, 2))
          resolve(result)
        }
      })
    })

    console.log("[v0] Payment result status:", paymentResult.status)

    if (paymentResult.status === "success") {
      console.log("[v0] Payment successful, updating subscription")

      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const { error: subError } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan_type: "premium",
          status: "active",
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentResult.paymentId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (subError) {
        console.error("[v0] Subscription update error:", subError)
      } else {
        console.log("[v0] Subscription updated successfully")
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: user.id,
        amount: price,
        currency: "TRY",
        payment_method: "credit_card",
        payment_id: paymentResult.paymentId,
        status: "success",
        description: "Premium abonelik ödemesi",
      })

      if (paymentError) {
        console.error("[v0] Payment record error:", paymentError)
      } else {
        console.log("[v0] Payment recorded successfully")
      }

      return NextResponse.json({
        status: "success",
        paymentId: paymentResult.paymentId,
        conversationId: paymentResult.conversationId,
        message: "Ödeme başarılı",
      })
    } else {
      console.error("[v0] Payment failed:", paymentResult)
      return NextResponse.json(
        {
          status: "error",
          message: paymentResult.errorMessage || "Ödeme başarısız",
          errorCode: paymentResult.errorCode,
          errorGroup: paymentResult.errorGroup,
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
