// lib/api/payments.ts

import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { absoluteUrl } from "@/lib/utils"
import { headers } from "next/headers"

const settingsUrl = absoluteUrl("/settings")

export async function createPaymentIntent(price: number, orderId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: "USD",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
      },
    })

    return paymentIntent.client_secret
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function handleStripeWebhook() {
  const body = await readRawBody()
  const signature = headers().get("Stripe-Signature") as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as any
  const orderId = session?.metadata?.orderId as string
  const amount = session?.amount_total as number

  if (event.type === "checkout.session.completed") {
    if (!orderId) {
      return new Response(`Webhook Error: Missing orderId`, { status: 400 })
    }

    await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        isPaid: true,
        address: session?.customer_details?.address,
        name: session?.customer_details?.name,
        phone: session?.customer_details?.phone,
      },
    })
  }

  if (event.type === "payment_intent.failed") {
    await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        isPaid: false,
      },
    })
  }

  return new Response(null, { status: 200 })
}

async function readRawBody() {
  const req = await fetch(headers().get("x-invoke-path") as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return await req.text()
}
