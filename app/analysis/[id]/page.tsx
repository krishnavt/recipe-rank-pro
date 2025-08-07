'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Target, Lightbulb, Code, TrendingUp } from 'lucide-react'

interface AnalysisDetails {
  id: string
  recipeUrl: string
  originalTitle: string
  optimizedTitle: string
  originalDescription: string
  optimizedDescription: string
  seoScore: number
  targetKeywords: string[]
  suggestedKeywords: string[]
  competitorAnalysis: any
  schemaMarkup: string
  optimizationSuggestions: string[]
  createdAt: string
}

export default function AnalysisDetailsPage({ params }: { params: { id: string } }) {
  const [analysis, setAnalysis] = useState<AnalysisDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchAnalysisDetails()
  }, [params.id])

  const fetchAnalysisDetails = async () => {
    try {
      const response = await fetch(`/api/analysis/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis details')
      }
      
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Error fetching analysis details:', error)
      setError('Failed to load analysis details')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis details...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Analysis not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Analysis Details</span>
              </div>
            </div>
            <Badge variant={getScoreBadgeVariant(analysis.seoScore)} className="text-lg px-3 py-1">
              {analysis.seoScore}/100
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recipe Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.originalTitle}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}</span>
            <a 
              href={analysis.recipeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <span>View Original</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* SEO Analysis */}
          <div className="space-y-6">
            {/* SEO Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span>SEO Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(analysis.seoScore)} mb-2`}>
                    {analysis.seoScore}
                  </div>
                  <p className="text-gray-600">out of 100</p>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        analysis.seoScore >= 80 ? 'bg-green-500' : 
                        analysis.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.seoScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Title Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>Title Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Original Title</Label>
                  <p className="text-gray-900 border rounded p-2 bg-gray-50">{analysis.originalTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Optimized Title</Label>
                  <div className="relative">
                    <p className="text-gray-900 border rounded p-2 bg-green-50 border-green-200">
                      {analysis.optimizedTitle}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1 right-1 h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(analysis.optimizedTitle)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Description */}
            <Card>
              <CardHeader>
                <CardTitle>Meta Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Original Description</Label>
                  <p className="text-gray-900 border rounded p-2 bg-gray-50">{analysis.originalDescription}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Optimized Description</Label>
                  <div className="relative">
                    <p className="text-gray-900 border rounded p-2 bg-green-50 border-green-200">
                      {analysis.optimizedDescription}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1 right-1 h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(analysis.optimizedDescription)}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analysis.optimizedDescription.length} characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="space-y-6">
            {/* Optimization Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <span>Optimization Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.optimizationSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.targetKeywords.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Target Keywords</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.targetKeywords.map((keyword, index) => (
                        <Badge key={index} variant="default">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Suggested Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.suggestedKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitor Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Competitor Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {analysis.competitorAnalysis?.insight || 'Competitor analysis completed'}
                </p>
                {analysis.competitorAnalysis?.topCompetitors && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Top Performing Recipes</Label>
                    {analysis.competitorAnalysis.topCompetitors.map((competitor: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 truncate">{competitor.url}</span>
                        <Badge variant="outline">Score: {competitor.score}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schema Markup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5 text-purple-600" />
                  <span>Recipe Schema Markup</span>
                </CardTitle>
                <CardDescription>
                  Add this JSON-LD to your recipe page for rich snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-64">
                    {analysis.schemaMarkup}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(analysis.schemaMarkup)}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// Add Label component if missing
function Label({ children, className, ...props }: any) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
      {children}
    </label>
  )
}
