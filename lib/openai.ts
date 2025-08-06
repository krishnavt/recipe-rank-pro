import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface RecipeData {
  title: string
  description: string
  images: string[]
  author: string
  publishDate: string
  prepTime: string
  cookTime: string
  totalTime: string
  servings: string
  category: string
  cuisine: string
  ingredients: string[]
  instructions: string[]
  nutrition?: {
    calories?: string
    protein?: string
    carbs?: string
    fat?: string
  }
  rating?: number
  reviewCount?: number
  url: string
}

export interface RecipeAnalysis {
  seoScore: number
  titleSuggestions: string[]
  descriptionSuggestions: string[]
  keywordDensity: Record<string, number>
  missingKeywords: string[]
  structureImprovements: string[]
  schemaMarkup: object
  competitorInsights: string[]
  optimizationPriority: string[]
}

const RecipeAnalysisSchema = z.object({
  seoScore: z.number().min(0).max(100),
  titleSuggestions: z.array(z.string()).max(5),
  descriptionSuggestions: z.array(z.string()).max(3),
  keywordDensity: z.record(z.number()),
  missingKeywords: z.array(z.string()),
  structureImprovements: z.array(z.string()),
  schemaMarkup: z.object({}),
  competitorInsights: z.array(z.string()),
  optimizationPriority: z.array(z.string()).max(3),
})

export class RecipeOptimizer {
  async analyzeRecipe(content: string, targetKeyword: string): Promise<RecipeAnalysis> {
    const prompt = `
You are an expert SEO specialist for food blogs. Analyze this recipe content and provide optimization recommendations.

Target Keyword: ${targetKeyword}
Recipe Content: ${content}

Provide a JSON response with:
1. seoScore (0-100): Overall SEO optimization score
2. titleSuggestions (array): 5 optimized title variations that include the target keyword
3. descriptionSuggestions (array): 3 meta description options (150-160 chars) that include the target keyword
4. keywordDensity (object): Analysis of keyword usage with percentages
5. missingKeywords (array): Important related keywords to add
6. structureImprovements (array): Content structure recommendations
7. schemaMarkup (object): Recipe schema.org markup structure
8. competitorInsights (array): What successful recipe posts typically include
9. optimizationPriority (array): Top 3 most impactful changes to make

Focus on food blog SEO best practices:
- Recipe schema markup for rich snippets
- Ingredient and cooking method optimization
- Nutritional information keywords
- User experience signals (cooking time, difficulty)
- Featured snippet optimization

Return only valid JSON without any markdown formatting.
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Clean the response to ensure it's valid JSON
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsedResponse = JSON.parse(cleanedContent)
      
      // Validate the response structure
      return RecipeAnalysisSchema.parse(parsedResponse)
    } catch (error) {
      console.error('OpenAI analysis error:', error)
      
      // Return a fallback analysis if OpenAI fails
      return {
        seoScore: 50,
        titleSuggestions: [`${targetKeyword} - Easy Recipe`, `Best ${targetKeyword} Recipe`, `Homemade ${targetKeyword}`],
        descriptionSuggestions: [`Learn how to make ${targetKeyword} with this easy recipe.`, `Quick and delicious ${targetKeyword} recipe.`],
        keywordDensity: { [targetKeyword]: 2.5 },
        missingKeywords: ['easy', 'homemade', 'recipe'],
        structureImprovements: ['Add cooking time', 'Include nutritional information', 'Add step-by-step photos'],
        schemaMarkup: { "@type": "Recipe", "name": targetKeyword },
        competitorInsights: ['Include prep time', 'Add ingredient substitutions', 'Include nutritional facts'],
        optimizationPriority: ['Add recipe schema markup', 'Optimize title with target keyword', 'Include cooking time and difficulty']
      }
    }
  }

  async generateSchemaMarkup(recipe: RecipeData): Promise<string> {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": recipe.title,
      "description": recipe.description,
      "image": recipe.images,
      "author": {
        "@type": "Person",
        "name": recipe.author
      },
      "datePublished": recipe.publishDate,
      "prepTime": recipe.prepTime,
      "cookTime": recipe.cookTime,
      "totalTime": recipe.totalTime,
      "recipeYield": recipe.servings,
      "recipeCategory": recipe.category,
      "recipeCuisine": recipe.cuisine,
      "recipeIngredient": recipe.ingredients,
      "recipeInstructions": recipe.instructions.map((step, index) => ({
        "@type": "HowToStep",
        "name": `Step ${index + 1}`,
        "text": step,
        "url": `${recipe.url}#step${index + 1}`
      })),
      "nutrition": recipe.nutrition ? {
        "@type": "NutritionInformation",
        "calories": recipe.nutrition.calories,
        "proteinContent": recipe.nutrition.protein,
        "carbohydrateContent": recipe.nutrition.carbs,
        "fatContent": recipe.nutrition.fat
      } : undefined,
      "aggregateRating": recipe.rating ? {
        "@type": "AggregateRating",
        "ratingValue": recipe.rating,
        "reviewCount": recipe.reviewCount || 1
      } : undefined
    }

    // Remove undefined properties
    const cleanSchema = JSON.parse(JSON.stringify(schema))
    
    return JSON.stringify(cleanSchema, null, 2)
  }

  async extractRecipeFromUrl(url: string): Promise<Partial<RecipeData>> {
    // This would typically use a web scraping service or API
    // For now, we'll return a mock response
    const domain = new URL(url).hostname
    
    return {
      title: "Sample Recipe Title",
      description: "A delicious recipe extracted from the URL",
      author: domain.replace('www.', ''),
      url: url,
      ingredients: ["Sample ingredient 1", "Sample ingredient 2"],
      instructions: ["Step 1: Prepare ingredients", "Step 2: Cook according to instructions"],
    }
  }
}
