'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Zap } from 'lucide-react'

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false)
  const [recipeUrl, setRecipeUrl] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalyze = async () => {
    if (!recipeUrl) {
      setError('Please enter a recipe URL')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeUrl,
          targetKeyword: targetKeyword || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
      
      // Show success and redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RankMyRecipe</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analyze Recipe</h1>
          <p className="text-gray-600 mt-2">Get AI-powered SEO optimization for your recipe</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span>Recipe SEO Analysis</span>
            </CardTitle>
            <CardDescription>
              Enter a recipe URL and optional target keyword to get SEO optimization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipeUrl">Recipe URL *</Label>
              <Input
                id="recipeUrl"
                type="url"
                placeholder="https://example.com/my-recipe"
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="targetKeyword">Target Keyword (Optional)</Label>
              <Input
                id="targetKeyword"
                type="text"
                placeholder="chocolate chip cookies"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Analysis Complete!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>SEO Score:</strong> {result.analysis.seoScore}/100</p>
                  <p><strong>Optimized Title:</strong> {result.analysis.optimizedTitle}</p>
                  <p className="text-xs mt-2">Redirecting to dashboard in 3 seconds...</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Recipe...
                </>
              ) : (
                'Analyze Recipe'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Example URLs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Test URLs</CardTitle>
            <CardDescription>Try these example URLs to test the analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setRecipeUrl('https://example.com/chocolate-chip-cookies')}
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                https://example.com/chocolate-chip-cookies
              </button>
              <button
                onClick={() => setRecipeUrl('https://example.com/banana-bread-recipe')}
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                https://example.com/banana-bread-recipe
              </button>
              <button
                onClick={() => setRecipeUrl('https://example.com/pasta-marinara')}
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                https://example.com/pasta-marinara
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
