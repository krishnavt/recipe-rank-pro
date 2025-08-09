import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Analyze API called')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipeUrl, targetKeyword } = body

    if (!recipeUrl || !targetKeyword) {
      return NextResponse.json({ error: 'Recipe URL and target keyword are required' }, { status: 400 })
    }

    // Check usage limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true }
    })

    const plan = user?.subscriptionTier || 'starter'

    // Get usage this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const currentUsage = await prisma.recipeAnalysis.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth
        }
      }
    })
    const limits = { starter: 10, pro: 50, agency: -1 }
    const limit = limits[plan as keyof typeof limits] || 10
    
    if (limit !== -1 && currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        details: { usage: currentUsage, limit, plan }
      }, { status: 429 })
    }

    // Generate mock analysis
    const mockAnalysis = {
      originalTitle: `Recipe from ${new URL(recipeUrl).hostname}`,
      optimizedTitle: `${targetKeyword} - Perfect Recipe for Food Lovers`,
      originalDescription: "A delicious recipe that needs SEO optimization",
      optimizedDescription: `Learn how to make the perfect ${targetKeyword} with this easy, step-by-step recipe. Quick, delicious, and family-friendly!`,
      seoScore: Math.floor(Math.random() * 30) + 70,
      targetKeywords: [targetKeyword],
      suggestedKeywords: [
        `easy ${targetKeyword}`,
        `best ${targetKeyword}`,
        `homemade ${targetKeyword}`,
        `quick ${targetKeyword} recipe`,
        `${targetKeyword} ingredients`
      ],
      competitorAnalysis: {
        avgContentLength: 1200,
        topKeywords: [targetKeyword, `${targetKeyword} recipe`, "cooking"],
        avgSeoScore: 75
      },
      schemaMarkup: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Recipe", 
        "name": targetKeyword,
        "description": `Delicious ${targetKeyword} recipe`
      }),
      optimizationSuggestions: [
        `Include "${targetKeyword}" in the recipe title`,
        "Add recipe schema markup for rich snippets",
        "Optimize images with descriptive alt text",
        "Include prep time, cook time, and total time",
        "Add nutritional information if available"
      ]
    }

    // Save to database
    const analysis = await prisma.recipeAnalysis.create({
      data: {
        userId: session.user.id,
        recipeUrl,
        originalTitle: mockAnalysis.originalTitle,
        optimizedTitle: mockAnalysis.optimizedTitle,
        originalDescription: mockAnalysis.originalDescription,
        optimizedDescription: mockAnalysis.optimizedDescription,
        seoScore: mockAnalysis.seoScore,
        targetKeywords: mockAnalysis.targetKeywords,
        suggestedKeywords: mockAnalysis.suggestedKeywords,
        competitorAnalysis: mockAnalysis.competitorAnalysis,
        schemaMarkup: mockAnalysis.schemaMarkup,
        optimizationSuggestions: mockAnalysis.optimizationSuggestions
      }
    })

    const analysisId = analysis.id

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId: session.user.id,
        action: 'recipe_analysis',
        resourceUsed: 'ai_analysis',
        metadata: { recipeUrl, targetKeyword, seoScore: mockAnalysis.seoScore }
      }
    })

    return NextResponse.json({
      success: true,
      analysisId: analysisId,
      analysis: mockAnalysis,
      usageRemaining: limit === -1 ? 'unlimited' : limit - currentUsage - 1
    })

  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
