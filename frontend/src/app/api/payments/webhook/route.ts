import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia'
    })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 })
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && plan) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: plan as any,
              planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          })

          await prisma.payment.create({
            data: {
              stripePaymentId: session.payment_intent as string,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'SUCCEEDED',
              plan: plan as any,
              userId
            }
          })

          await prisma.notification.create({
            data: {
              type: 'SUBSCRIPTION_RENEWED',
              title: 'Subscription Activated',
              message: `Your ${plan} plan has been activated`,
              userId
            }
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const userId = invoice.metadata?.userId

        if (userId) {
          await prisma.notification.create({
            data: {
              type: 'SUBSCRIPTION_EXPIRING',
              title: 'Payment Failed',
              message: 'Your subscription payment failed. Please update your payment method.',
              userId
            }
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
