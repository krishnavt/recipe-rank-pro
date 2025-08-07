import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const analysisId = params.id
    const userId = session.user.id

    // Fetch analysis details - ensure it belongs to the current user
    const analysis = await prisma.recipeAnalysis.findFirst({
      where: {
        id: analysisId,
        userId: userId
      }
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        recipeUrl: analysis.recipeUrl,
        originalTitle: analysis.originalTitle,
        optimizedTitle: analysis.optimizedTitle,
        originalDescription: analysis.originalDescription,
        optimizedDescription: analysis.optimizedDescription,
        seoScore: analysis.seoScore,
        targetKeywords: analysis.targetKeywords,
        suggestedKeywords: analysis.suggestedKeywords,
        competitorAnalysis: analysis.competitorAnalysis,
        schemaMarkup: analysis.schemaMarkup,
        optimizationSuggestions: analysis.optimizationSuggestions,
        createdAt: analysis.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching analysis details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
