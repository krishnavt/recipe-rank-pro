import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const analyzeSchema = z.object({
  recipeUrl: z.string().url(),
  targetKeyword: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Analyze API called')
    
    // Step 1: Check session
    const session = await getServerSession(authOptions)
    console.log('Session check:', session ? 'Found' : 'Not found')
    
    if (!session?.user?.id) {
      console.log('❌ No user ID in session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User ID:', session.user.id)

    // Step 2: Parse request body
    let body
    try {
      body = await request.json()
      console.log('✅ Request body:', body)
    } catch (error) {
      console.log('❌ Failed to parse request body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Step 3: Validate input
    let validatedData
    try {
      validatedData = analyzeSchema.parse(body)
      console.log('✅ Validated data:', validatedData)
    } catch (error) {
      console.log('❌ Validation error:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    const { recipeUrl, targetKeyword } = validatedData
    const userId = session.user.id

    // Step 4: Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (error) {
      console.log('❌ Database connection failed:', error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Step 5: Check usage (simplified - using Prisma ORM)
    console.log('🔍 Checking user usage...')
    
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let thisMonthUsage = 0
    let user = null

    try {
      thisMonthUsage = await prisma.recipeAnalysis.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      })
      console.log('✅ This month usage:', thisMonthUsage)

      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
      })
      console.log('✅ User found:', user)
    } catch (error) {
      console.log('❌ Error checking usage:', error)
      return NextResponse.json(
        { error: 'Failed to check usage limits' },
        { status: 500 }
      )
    }

    const subscriptionTier = user?.subscriptionTier || 'starter'
    console.log('📊 Subscription tier:', subscriptionTier)

    // Step 6: Check limits
    const tierLimits = {
      starter: 10,
      pro: 50,
      agency: -1 // unlimited
    }

    const monthlyLimit = tierLimits[subscriptionTier as keyof typeof tierLimits] || 10

    if (monthlyLimit !== -1 && thisMonthUsage >= monthlyLimit) {
      console.log('❌ Monthly limit reached:', thisMonthUsage, '>=', monthlyLimit)
      return NextResponse.json(
        { error: 'Monthly analysis limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    console.log('✅ Usage check passed:', thisMonthUsage, '/', monthlyLimit)

    // Step 7: Generate mock analysis (skip OpenAI for now to isolate the issue)
    console.log('🎯 Generating mock analysis...')
    
    const mockAnalysis = {
      originalTitle: extractTitleFromUrl(recipeUrl),
      optimizedTitle: generateOptimizedTitle(extractTitleFromUrl(recipeUrl), targetKeyword),
      originalDescription: "Original recipe description",
      optimizedDescription: "SEO-optimized recipe description with target keywords",
      seoScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      targetKeywords: targetKeyword ? [targetKeyword] : [],
      suggestedKeywords: generateSuggestedKeywords(targetKeyword),
      competitorAnalysis: {
        insight: "Mock competitor analysis completed",
        topCompetitors: [
          { url: "https://example.com/recipe1", score: 85 },
          { url: "https://example.com/recipe2", score: 78 }
        ]
      },
      schemaMarkup: generateRecipeSchema(extractTitleFromUrl(recipeUrl)),
      optimizationSuggestions: [
        "Include target keyword in title",
        "Add more descriptive meta description",
        "Use recipe schema markup"
      ]
    }

    console.log('✅ Mock analysis generated:', mockAnalysis.seoScore)

    // Step 8: Save to database
    console.log('💾 Saving analysis to database...')
    
    let analysis
    try {
      analysis = await prisma.recipeAnalysis.create({
        data: {
          userId,
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
      console.log('✅ Analysis saved with ID:', analysis.id)
    } catch (error) {
      console.log('❌ Error saving analysis:', error)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    // Step 9: Log usage
    console.log('📝 Logging usage...')
    
    try {
      await prisma.usageLog.create({
        data: {
          userId,
          action: 'recipe_analysis',
          resourceUsed: 'mock_analysis',
          metadata: { 
            recipeUrl, 
            targetKeyword,
            model: 'mock'
          }
        }
      })
      console.log('✅ Usage logged')
    } catch (error) {
      console.log('❌ Error logging usage:', error)
      // Don't fail the request for logging errors
    }

    console.log('🎉 Analysis completed successfully!')

    return NextResponse.json({
      analysis,
      message: 'Mock recipe analysis completed successfully'
    })

  } catch (error) {
    console.error('💥 Analyze API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

// Helper functions
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    return lastSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\.(html|htm|php)$/i, '') || 'Delicious Recipe'
  } catch {
    return 'Delicious Recipe'
  }
}

function generateOptimizedTitle(originalTitle: string, targetKeyword?: string): string {
  if (targetKeyword) {
    return `${targetKeyword} - ${originalTitle} (Easy Recipe)`
  }
  return `${originalTitle} - Perfect Recipe for Home Cooks`
}

function generateSuggestedKeywords(targetKeyword?: string): string[] {
  const baseKeywords = ['easy recipe', 'homemade', 'quick', 'healthy', 'delicious']
  
  if (targetKeyword) {
    return [
      targetKeyword,
      `${targetKeyword} recipe`,
      `easy ${targetKeyword}`,
      `homemade ${targetKeyword}`,
      `best ${targetKeyword}`
    ]
  }
  
  return baseKeywords
}

function generateRecipeSchema(title: string): string {
  return JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": title,
    "author": {
      "@type": "Person",
      "name": "Recipe Author"
    },
    "description": "A delicious and easy recipe",
    "recipeCategory": "Main Course",
    "cookTime": "PT30M",
    "prepTime": "PT15M",
    "totalTime": "PT45M",
    "recipeYield": "4 servings",
    "keywords": title.toLowerCase()
  }, null, 2)
}
