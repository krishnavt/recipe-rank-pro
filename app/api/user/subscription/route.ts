import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        subscriptionTier: true,
        stripeCustomerId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      hasStripeCustomer: !!user.stripeCustomerId
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}