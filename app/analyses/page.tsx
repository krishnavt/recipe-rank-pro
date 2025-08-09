'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  BarChart3, 
  ExternalLink, 
  Calendar,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'

interface Analysis {
  id: string
  recipeUrl: string
  originalTitle: string
  optimizedTitle: string
  seoScore: number
  targetKeywords: string[]
  createdAt: string
}

export default function AnalysesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchAnalyses()
  }, [session, status])

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/analyses')
      const data = await response.json()
      
      if (response.ok) {
        setAnalyses(data.analyses)
      } else {
        console.error('Failed to fetch analyses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.originalTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.recipeUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.targetKeywords?.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading your analyses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recipe Analyses</h1>
                <p className="text-gray-600">View and manage all your recipe analyses</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{analyses.length} total analyses</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search analyses by title, URL, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Results */}
        {filteredAnalyses.length > 0 ? (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {analysis.originalTitle || 'Untitled Recipe'}
                        </h3>
                        <Badge className={`px-2 py-1 text-sm ${getSeoScoreColor(analysis.seoScore)}`}>
                          SEO Score: {analysis.seoScore}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-2">
                        <strong>Optimized:</strong> {analysis.optimizedTitle}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          {new URL(analysis.recipeUrl).hostname}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {analysis.targetKeywords && analysis.targetKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {analysis.targetKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <a href={analysis.recipeUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No analyses match your search' : 'No analyses yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search to see all analyses.' 
                  : 'Get started by analyzing your first recipe!'
                }
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Start Your First Analysis
                  </Link>
                </Button>
              )}
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}