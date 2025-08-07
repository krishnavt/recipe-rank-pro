import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard stats API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.id) {
      console.log('No user ID in session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('User ID:', userId)

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get dashboard statistics using raw queries with better error handling
    let totalRecipes = 0
    let thisMonth = 0
    let avgScore = null
    let subscriptionTier = 'starter'
    let recentAnalyses: any[] = []

    try {
      // Total recipes analyzed
      console.log('Fetching total recipes...')
      const totalRecipesResult = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count 
        FROM "RecipeAnalysis" 
        WHERE "userId" = ${userId}
      `
      totalRecipes = Number(totalRecipesResult[0]?.count || 0)
      console.log('Total recipes:', totalRecipes)
    } catch (error) {
      console.error('Error fetching total recipes:', error)
      // Continue with default value
    }

    try {
      // Recipes analyzed this month
      console.log('Fetching this month recipes...')
      const thisMonthResult = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count 
        FROM "RecipeAnalysis" 
        WHERE "userId" = ${userId} 
        AND "createdAt" >= date_trunc('month', CURRENT_DATE)
      `
      thisMonth = Number(thisMonthResult[0]?.count || 0)
      console.log('This month recipes:', thisMonth)
    } catch (error) {
      console.error('Error fetching this month recipes:', error)
      // Continue with default value
    }

    try {
      // Average SEO score
      console.log('Fetching average score...')
      const avgScoreResult = await prisma.$queryRaw<{avg: number | null}[]>`
        SELECT AVG("seoScore") as avg 
        FROM "RecipeAnalysis" 
        WHERE "userId" = ${userId} 
        AND "seoScore" IS NOT NULL
      `
      avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : null
      console.log('Average score:', avgScore)
    } catch (error) {
      console.error('Error fetching average score:', error)
      // Continue with default value
    }

    try {
      // User subscription info
      console.log('Fetching user subscription...')
      const userResult = await prisma.$queryRaw<{subscriptionTier: string}[]>`
        SELECT "subscriptionTier" 
        FROM "User" 
        WHERE id = ${userId}
      `
      subscriptionTier = userResult[0]?.subscriptionTier || 'starter'
      console.log('Subscription tier:', subscriptionTier)
    } catch (error) {
      console.error('Error fetching user subscription:', error)
      // Continue with default value
    }

    try {
      // Recent analyses for activity feed
      console.log('Fetching recent analyses...')
      const recentAnalysesResult = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          "recipeUrl",
          "originalTitle",
          "optimizedTitle",
          "seoScore",
          "createdAt"
        FROM "RecipeAnalysis" 
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `
      recentAnalyses = recentAnalysesResult || []
      console.log('Recent analyses count:', recentAnalyses.length)
    } catch (error) {
      console.error('Error fetching recent analyses:', error)
      // Continue with empty array
    }

    // Calculate remaining analyses based on subscription tier
    const tierLimits = {
      starter: 10,
      pro: 50,
      agency: -1 // unlimited
    }
    
    const monthlyLimit = tierLimits[subscriptionTier as keyof typeof tierLimits] || 10
    const remainingAnalyses = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - thisMonth)

    const response = {
      totalRecipes,
      thisMonth,
      avgScore,
      subscriptionTier,
      remainingAnalyses,
      monthlyLimit,
      recentAnalyses: recentAnalyses.map(analysis => ({
        id: analysis.id,
        recipeUrl: analysis.recipeUrl,
        title: analysis.optimizedTitle || analysis.originalTitle || 'Untitled Recipe',
        seoScore: analysis.seoScore,
        createdAt: analysis.createdAt
      }))
    }

    console.log('Sending response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    // Send a more detailed error response in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
