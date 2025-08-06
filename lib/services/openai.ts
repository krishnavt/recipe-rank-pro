import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface RecipeAnalysisRequest {
  recipeUrl: string
  recipeContent?: string
  targetKeyword: string
  currentTitle: string
  currentDescription?: string
}

export interface RecipeAnalysisResult {
  optimizedTitle: string
  optimizedDescription: string
  seoScore: number
  targetKeywords: string[]
  suggestedKeywords: string[]
  optimizationSuggestions: string[]
  schemaMarkup: string
  competitorAnalysis?: {
    topCompetitors: string[]
    contentGaps: string[]
    opportunityKeywords: string[]
  }
}

export class OpenAIService {
  static async analyzeRecipe(request: RecipeAnalysisRequest): Promise<RecipeAnalysisResult> {
    try {
      const prompt = `
You are an expert SEO specialist for food blogs. Analyze this recipe and provide optimization recommendations.

Recipe URL: ${request.recipeUrl}
Current Title: ${request.currentTitle}
Current Description: ${request.currentDescription || 'Not provided'}
Target Keyword: ${request.targetKeyword}
Recipe Content: ${request.recipeContent || 'URL provided - analyze based on URL'}

Please provide a comprehensive SEO analysis in the following JSON format:

{
  "optimizedTitle": "SEO-optimized title (max 60 characters)",
  "optimizedDescription": "SEO-optimized meta description (max 155 characters)",
  "seoScore": 85,
  "targetKeywords": ["primary keyword", "secondary keyword"],
  "suggestedKeywords": ["additional keyword 1", "additional keyword 2", "additional keyword 3"],
  "optimizationSuggestions": [
    "Use target keyword in first 100 words",
    "Add more descriptive alt text to images",
    "Include cooking time and servings in title"
  ],
  "schemaMarkup": "JSON-LD structured data for Recipe schema"
}

Focus on:
1. Title optimization for search engines and click-through rates
2. Meta description that encourages clicks
3. Keyword density and placement recommendations
4. Recipe schema markup for rich snippets
5. Content structure improvements
6. User experience enhancements

Return only valid JSON with no additional text.
      `

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4",
        temperature: 0.3,
        max_tokens: 1500,
      })

      const result = completion.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const analysis = JSON.parse(result) as RecipeAnalysisResult
      
      // Validate required fields
      if (!analysis.optimizedTitle || !analysis.optimizedDescription) {
        throw new Error('Invalid response format from OpenAI')
      }

      return analysis
    } catch (error) {
      console.error('OpenAI Service Error:', error)
      throw new Error('Failed to analyze recipe with AI')
    }
  }

  static async generateKeywordSuggestions(recipeType: string, cuisine?: string): Promise<string[]> {
    try {
      const prompt = `
Generate 15 high-converting, SEO-friendly keywords for a ${recipeType} recipe${cuisine ? ` in ${cuisine} cuisine` : ''}.

Focus on:
- Long-tail keywords with good search volume
- Intent-based keywords (easy, quick, best, homemade)
- Seasonal and trending variations
- Local and cultural variations

Return as a simple JSON array of strings:
["keyword1", "keyword2", "keyword3", ...]
      `

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4",
        temperature: 0.5,
        max_tokens: 500,
      })

      const result = completion.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(result) as string[]
    } catch (error) {
      console.error('Keyword Generation Error:', error)
      throw new Error('Failed to generate keyword suggestions')
    }
  }

  static async createSchemaMarkup(recipeData: {
    name: string
    description: string
    cookTime?: string
    prepTime?: string
    totalTime?: string
    servings?: string
    ingredients?: string[]
    instructions?: string[]
    nutrition?: object
    author?: string
    image?: string
  }): Promise<string> {
    try {
      const schema = {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": recipeData.name,
        "description": recipeData.description,
        "image": recipeData.image || [],
        "author": {
          "@type": "Person",
          "name": recipeData.author || "RecipeRankPro User"
        },
        "cookTime": recipeData.cookTime || "PT30M",
        "prepTime": recipeData.prepTime || "PT15M",
        "totalTime": recipeData.totalTime || "PT45M",
        "recipeYield": recipeData.servings || "4 servings",
        "recipeIngredient": recipeData.ingredients || [],
        "recipeInstructions": recipeData.instructions?.map(instruction => ({
          "@type": "HowToStep",
          "text": instruction
        })) || [],
        "nutrition": recipeData.nutrition || {
          "@type": "NutritionInformation",
          "calories": "250 calories"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "ratingCount": "1"
        }
      }

      return JSON.stringify(schema, null, 2)
    } catch (error) {
      console.error('Schema Generation Error:', error)
      throw new Error('Failed to generate schema markup')
    }
  }
}
