import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyAnalyses = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${session.user.id} 
      AND "createdAt" >= ${startOfMonth}
    `

    const totalAnalyses = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${session.user.id}
    `

    const avgScore = await prisma.$queryRaw<any[]>`
      SELECT AVG("seoScore") as avg 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${session.user.id}
    `

    const recentActivity = await prisma.$queryRaw<any[]>`
      SELECT id, "recipeUrl", "optimizedTitle", "seoScore", "createdAt"
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `

    return NextResponse.json({
      recipesAnalyzed: Number(monthlyAnalyses[0].count),
      totalRecipes: Number(totalAnalyses[0].count),
      seoScoreAverage: Math.round(Number(avgScore[0].avg) || 0),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        title: activity.optimizedTitle || 'Recipe Analysis',
        url: activity.recipeUrl,
        seoScore: activity.seoScore,
        createdAt: activity.createdAt
      }))
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
