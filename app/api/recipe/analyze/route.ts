import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import OpenAI from 'openai'

// Initialize OpenAI with error handling
let openai: OpenAI | null = null

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
} catch (error) {
  console.error('OpenAI initialization error:', error)
}

const analyzeSchema = z.object({
  recipeUrl: z.string().url(),
  targetKeyword: z.string().min(1),
  currentTitle: z.string().min(1),
  currentDescription: z.string().optional(),
})

export async function POST(request: NextRequest) {
  console.log('🚀 Recipe Analysis API called')

  try {
    // Check if OpenAI is properly initialized
    if (!openai) {
      console.error('❌ OpenAI not initialized - check API key')
      return NextResponse.json(
        { error: 'OpenAI service not available. Please check configuration.' },
        { status: 500 }
      )
    }

    // Check authentication
    console.log('🔐 Checking authentication...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ No session found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.email)

    // Parse request body
    console.log('📝 Parsing request body...')
    const body = await request.json()
    console.log('📄 Request data:', body)
    
    const validation = analyzeSchema.safeParse(body)
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error)
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { recipeUrl, targetKeyword, currentTitle, currentDescription } = validation.data

    // Check usage limits
    console.log('📊 Checking usage limits...')
    try {
      const userAnalysesThisMonth = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count 
        FROM "RecipeAnalysis" 
        WHERE "userId" = ${session.user.id} 
        AND "createdAt" >= date_trunc('month', CURRENT_DATE)
      `

      const analysesCount = Number(userAnalysesThisMonth[0].count)
      console.log('📈 Monthly analyses count:', analysesCount)

      if (analysesCount >= 10) {
        return NextResponse.json(
          { error: 'Monthly analysis limit reached. Upgrade your plan for more analyses.' },
          { status: 403 }
        )
      }
    } catch (dbError) {
      console.error('❌ Database error checking limits:', dbError)
      // Continue anyway - don't block the analysis for DB issues
    }

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API...')
    
    const prompt = `You are an expert SEO specialist for food blogs. Analyze this recipe and provide optimization recommendations.

Recipe URL: ${recipeUrl}
Current Title: ${currentTitle}
Current Description: ${currentDescription || 'Not provided'}
Target Keyword: ${targetKeyword}

Please provide a comprehensive SEO analysis in the following JSON format (return ONLY valid JSON with no additional text):

{
  "optimizedTitle": "SEO-optimized title (max 60 characters)",
  "optimizedDescription": "SEO-optimized meta description (max 155 characters)",
  "seoScore": 85,
  "targetKeywords": ["${targetKeyword}", "secondary keyword"],
  "suggestedKeywords": ["additional keyword 1", "additional keyword 2", "additional keyword 3"],
  "optimizationSuggestions": [
    "Use target keyword in first 100 words",
    "Add more descriptive alt text to images",
    "Include cooking time and servings in title"
  ],
  "schemaMarkup": "{\\"@context\\": \\"https://schema.org/\\", \\"@type\\": \\"Recipe\\", \\"name\\": \\"${currentTitle}\\", \\"description\\": \\"Delicious recipe optimized for SEO\\"}"
}

Focus on making the title and description compelling for both search engines and users.`

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini", // Using cheaper model for testing
      temperature: 0.3,
      max_tokens: 1000,
    })

    console.log('✅ OpenAI response received')

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    console.log('📄 OpenAI raw response:', result)

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(result.trim())
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', result)
      
      // Fallback response
      analysis = {
        optimizedTitle: `${targetKeyword} - ${currentTitle}`.substring(0, 60),
        optimizedDescription: `Learn how to make the perfect ${targetKeyword}. This recipe is easy to follow and delivers amazing results every time!`,
        seoScore: 75,
        targetKeywords: [targetKeyword],
        suggestedKeywords: [`easy ${targetKeyword}`, `best ${targetKeyword}`, `homemade ${targetKeyword}`],
        optimizationSuggestions: [
          "Include target keyword in the first paragraph",
          "Add cooking time and difficulty level to title",
          "Use descriptive headers with keywords"
        ],
        schemaMarkup: `{"@context": "https://schema.org/", "@type": "Recipe", "name": "${currentTitle}", "description": "Delicious ${targetKeyword} recipe"}`
      }
    }

    // Save to database (with error handling)
    console.log('💾 Saving to database...')
    let savedAnalysis
    try {
      savedAnalysis = await prisma.$queryRaw<any[]>`
        INSERT INTO "RecipeAnalysis" (
          id, "userId", "recipeUrl", "originalTitle", "optimizedTitle", 
          "originalDescription", "optimizedDescription", "seoScore", 
          "targetKeywords", "suggestedKeywords", "optimizationSuggestions", 
          "schemaMarkup", "createdAt"
        )
        VALUES (
          gen_random_uuid()::text,
          ${session.user.id},
          ${recipeUrl},
          ${currentTitle},
          ${analysis.optimizedTitle},
          ${currentDescription || null},
          ${analysis.optimizedDescription},
          ${analysis.seoScore},
          ${JSON.stringify(analysis.targetKeywords)},
          ${JSON.stringify(analysis.suggestedKeywords)},
          ${JSON.stringify(analysis.optimizationSuggestions)},
          ${analysis.schemaMarkup},
          NOW()
        )
        RETURNING id
      `

      // Log usage
      await prisma.$queryRaw`
        INSERT INTO "UsageLog" (id, "userId", action, "resourceUsed", metadata, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${session.user.id},
          'recipe_analysis',
          'openai_gpt4_mini',
          ${JSON.stringify({ recipeUrl, targetKeyword })},
          NOW()
        )
      `

      console.log('✅ Data saved successfully')
    } catch (dbError) {
      console.error('❌ Database save error:', dbError)
      // Continue anyway - return the analysis even if saving fails
    }

    console.log('🎉 Analysis complete!')

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedAnalysis?.[0]?.id || 'temp-id',
        ...analysis
      }
    })

  } catch (error) {
    console.error('❌ Recipe Analysis Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'AI analysis service temporarily unavailable. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Analysis failed. Please try again.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const analyses = await prisma.$queryRaw<any[]>`
      SELECT 
        id, "recipeUrl", "originalTitle", "optimizedTitle", 
        "seoScore", "createdAt"
      FROM "RecipeAnalysis"
      WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      analyses
    })

  } catch (error) {
    console.error('Get Analyses Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}
