'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BarChart3, Target, Lightbulb, Code } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AnalysisResult {
  id: string
  optimizedTitle: string
  optimizedDescription: string
  seoScore: number
  targetKeywords: string[]
  suggestedKeywords: string[]
  optimizationSuggestions: string[]
  schemaMarkup: string
}

export default function RecipeAnalysisForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [formData, setFormData] = useState({
    recipeUrl: '',
    targetKeyword: '',
    currentTitle: '',
    currentDescription: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/recipe/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data.analysis)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Analysis Complete
            </CardTitle>
            <CardDescription>
              Your recipe has been analyzed and optimized for better SEO performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{result.seoScore}/100</div>
                <div className="text-sm text-gray-600">SEO Score</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.targetKeywords.length}</div>
                <div className="text-sm text-gray-600">Target Keywords</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.optimizationSuggestions.length}</div>
                <div className="text-sm text-gray-600">Suggestions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimized Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Optimized Title
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Before</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">{formData.currentTitle}</p>
                <Label className="text-sm text-gray-600">After</Label>
                <p className="text-sm bg-green-50 p-3 rounded font-medium">{result.optimizedTitle}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Optimized Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Before</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">{formData.currentDescription || 'Not provided'}</p>
                <Label className="text-sm text-gray-600">After</Label>
                <p className="text-sm bg-green-50 p-3 rounded font-medium">{result.optimizedDescription}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.optimizationSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Target Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.targetKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.suggestedKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schema Markup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              Schema Markup
            </CardTitle>
            <CardDescription>
              Copy this JSON-LD structured data to your recipe page's &lt;head&gt; section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{result.schemaMarkup}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => {
            setResult(null)
            setFormData({
              recipeUrl: '',
              targetKeyword: '',
              currentTitle: '',
              currentDescription: ''
            })
          }}>
            Analyze Another Recipe
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Analyze Your Recipe</CardTitle>
        <CardDescription>
          Get AI-powered SEO optimization suggestions for your food blog recipe.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipeUrl">Recipe URL *</Label>
            <Input
              id="recipeUrl"
              type="url"
              placeholder="https://yourblog.com/amazing-chocolate-cake"
              value={formData.recipeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, recipeUrl: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetKeyword">Target Keyword *</Label>
            <Input
              id="targetKeyword"
              placeholder="chocolate cake recipe"
              value={formData.targetKeyword}
              onChange={(e) => setFormData(prev => ({ ...prev, targetKeyword: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentTitle">Current Title *</Label>
            <Input
              id="currentTitle"
              placeholder="Amazing Chocolate Cake"
              value={formData.currentTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, currentTitle: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentDescription">Current Meta Description</Label>
            <Textarea
              id="currentDescription"
              placeholder="Optional: Your current meta description"
              value={formData.currentDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, currentDescription: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Analyzing...' : 'Analyze Recipe'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
