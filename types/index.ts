export interface User {
 id: string
 name?: string
 email: string
 image?: string
 subscriptionTier: 'starter' | 'pro' | 'agency'
 stripeCustomerId?: string
 createdAt: Date
 updatedAt: Date
}

export interface RecipeAnalysis {
 id: string
 userId: string
 recipeUrl: string
 originalTitle?: string
 optimizedTitle?: string
 originalDescription?: string
 optimizedDescription?: string
 seoScore?: number
 targetKeywords?: any
 suggestedKeywords?: any
 competitorAnalysis?: any
 schemaMarkup?: string
 optimizationSuggestions?: any
 createdAt: Date
}

export interface UsageLog {
 id: string
 userId: string
 action: string
 resourceUsed: string
 metadata?: any
 createdAt: Date
}

export interface Subscription {
 id: string
 userId: string
 stripeSubscriptionId: string
 status: string
 currentPeriodStart: Date
 currentPeriodEnd: Date
 planId: string
 createdAt: Date
 updatedAt: Date
}

export interface SubscriptionPlan {
 id: string
 name: string
 description: string
 price: number
 interval: 'month' | 'year'
 features: string[]
 maxAnalyses: number
 stripePriceId: string
}

export interface SEOAnalysisResult {
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
