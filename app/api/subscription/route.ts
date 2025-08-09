import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Subscription" 
      WHERE "userId" = ${session.user.id} 
      AND status IN ('active', 'trialing')
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `

    if (!subscription[0]) {
      return NextResponse.json({ subscription: null, usage: 0 })
    }

    // Get usage this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usage = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${session.user.id} 
      AND "createdAt" >= ${startOfMonth}
    `

    return NextResponse.json({
      subscription: subscription[0],
      usage: Number(usage[0].count)
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
