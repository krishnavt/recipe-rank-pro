import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!['starter', 'pro', 'agency'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    const user = await prisma.$queryRaw<any[]>`
      SELECT * FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user[0].stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user[0].email,
        name: user[0].name || undefined,
        metadata: {
          userId: session.user.id,
        },
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await prisma.$queryRaw`
        UPDATE "User" 
        SET "stripeCustomerId" = ${customerId}
        WHERE id = ${session.user.id}
      `
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[planId as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        planId,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: session.user.id,
          planId,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
