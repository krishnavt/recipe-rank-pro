import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BarChart3, Calendar, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/db'

async function getUserAnalyses(userId: string) {
  try {
    const analyses = await prisma.$queryRaw<any[]>`
      SELECT 
        id, "recipeUrl", "originalTitle", "optimizedTitle", 
        "seoScore", "targetKeywords", "createdAt"
      FROM "RecipeAnalysis"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `
    
    return analyses.map(analysis => ({
      ...analysis,
      targetKeywords: analysis.targetKeywords ? JSON.parse(analysis.targetKeywords) : [],
      createdAt: new Date(analysis.createdAt)
    }))
  } catch (error) {
    console.error('Failed to fetch analyses:', error)
    return []
  }
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const analyses = await getUserAnalyses(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
            </div>
            <Link href="/dashboard/analyze">
              <Button>New Analysis</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analyses.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle>No Analyses Yet</CardTitle>
              <CardDescription>
                You haven't analyzed any recipes yet. Start by analyzing your first recipe to see results here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/analyze">
                <Button>Analyze Your First Recipe</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Recipe Analyses ({analyses.length})
              </h2>
            </div>

            <div className="grid gap-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {analysis.originalTitle}
                          </h3>
                          {analysis.seoScore && (
                            <Badge variant={analysis.seoScore >= 80 ? "default" : analysis.seoScore >= 60 ? "secondary" : "outline"}>
                              SEO: {analysis.seoScore}/100
                            </Badge>
                          )}
                        </div>

                        {analysis.optimizedTitle && analysis.optimizedTitle !== analysis.originalTitle && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">Optimized Title:</p>
                            <p className="text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded">
                              {analysis.optimizedTitle}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {analysis.createdAt.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-4 w-4" />
                            <a 
                              href={analysis.recipeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-xs"
                            >
                              {new URL(analysis.recipeUrl).hostname}
                            </a>
                          </div>
                        </div>

                        {analysis.targetKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {analysis.targetKeywords.slice(0, 3).map((keyword: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                {keyword}
                              </span>
                            ))}
                            {analysis.targetKeywords.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{analysis.targetKeywords.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        <Link href={`/dashboard/analysis/${analysis.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
