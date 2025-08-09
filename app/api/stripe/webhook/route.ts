import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await handleSubscriptionCreated(subscription, session.metadata?.userId!)
        }
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(updatedSubscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(deletedSubscription)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          console.log('Payment succeeded for subscription:', invoice.subscription)
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        if (failedInvoice.subscription) {
          console.log('Payment failed for subscription:', failedInvoice.subscription)
        }
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  userId: string
) {
  const planId = subscription.metadata?.planId || 'starter'
  
  try {
    await prisma.$queryRaw`
      INSERT INTO "Subscription" (
        id, "userId", "stripeSubscriptionId", status, 
        "currentPeriodStart", "currentPeriodEnd", "planId", 
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, ${userId}, ${subscription.id}, ${subscription.status},
        ${new Date(subscription.current_period_start * 1000)},
        ${new Date(subscription.current_period_end * 1000)}, ${planId},
        NOW(), NOW()
      )
      ON CONFLICT ("stripeSubscriptionId") 
      DO UPDATE SET 
        status = ${subscription.status},
        "currentPeriodStart" = ${new Date(subscription.current_period_start * 1000)},
        "currentPeriodEnd" = ${new Date(subscription.current_period_end * 1000)},
        "updatedAt" = NOW()
    `

    // Update user subscription tier
    await prisma.$queryRaw`
      UPDATE "User" 
      SET "subscriptionTier" = ${planId}, "updatedAt" = NOW()
      WHERE id = ${userId}
    `

    console.log('Subscription created successfully for user:', userId)
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await prisma.$queryRaw`
      UPDATE "Subscription" 
      SET 
        status = ${subscription.status},
        "currentPeriodStart" = ${new Date(subscription.current_period_start * 1000)},
        "currentPeriodEnd" = ${new Date(subscription.current_period_end * 1000)},
        "updatedAt" = NOW()
      WHERE "stripeSubscriptionId" = ${subscription.id}
    `
    console.log('Subscription updated:', subscription.id)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const dbSubscription = await prisma.$queryRaw<any[]>`
      SELECT "userId" FROM "Subscription" 
      WHERE "stripeSubscriptionId" = ${subscription.id} 
      LIMIT 1
    `

    if (dbSubscription[0]) {
      await prisma.$queryRaw`
        UPDATE "Subscription" 
        SET status = 'canceled', "updatedAt" = NOW()
        WHERE "stripeSubscriptionId" = ${subscription.id}
      `

      await prisma.$queryRaw`
        UPDATE "User" 
        SET "subscriptionTier" = 'starter', "updatedAt" = NOW()
        WHERE id = ${dbSubscription[0].userId}
      `
      console.log('Subscription canceled for user:', dbSubscription[0].userId)
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
  }
}
