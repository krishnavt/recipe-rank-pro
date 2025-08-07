'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Target, TrendingUp, Clock, Plus, Activity } from 'lucide-react'

interface DashboardStats {
  totalRecipes: number
  thisMonth: number
  avgScore: number | null
  subscriptionTier: string
  remainingAnalyses: number
  monthlyLimit: number
  recentAnalyses: Array<{
    id: string
    recipeUrl: string
    title: string
    seoScore: number | null
    createdAt: string
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchDashboardStats()
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number | null) => {
    if (!score) return 'secondary'
    if (score >= 80) return 'default' // green
    if (score >= 60) return 'secondary' // yellow
    return 'destructive' // red
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardStats}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const usagePercentage = stats.monthlyLimit === -1 
    ? 0 
    : (stats.thisMonth / stats.monthlyLimit) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900">RankMyRecipe</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {session?.user?.name || session?.user?.email}</span>
              <Button 
                variant="outline" 
                onClick={() => router.push('/api/auth/signout')}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your RankMyRecipe dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Recipes Analyzed This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipes Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          {/* SEO Score Average */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SEO Score Average</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore || '--'}
              </div>
              <p className="text-xs text-muted-foreground">Across all recipes</p>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 capitalize">
                {stats.subscriptionTier}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyLimit === -1 
                  ? 'Unlimited analyses' 
                  : `${stats.remainingAnalyses} analyses remaining`
                }
              </p>
              {stats.monthlyLimit !== -1 && (
                <Progress 
                  value={usagePercentage} 
                  className="mt-2 h-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Total Recipes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Analyze New Recipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-orange-600" />
                <span>Analyze New Recipe</span>
              </CardTitle>
              <CardDescription>
                Ready to optimize your next recipe? Paste a recipe URL and target keyword to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push('/analyze')}
                disabled={stats.remainingAnalyses === 0}
              >
                {stats.remainingAnalyses === 0 ? 'Upgrade Plan' : 'Start Analysis'}
              </Button>
              {stats.remainingAnalyses === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  You've reached your monthly limit. Upgrade to continue analyzing.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your latest recipe analyses and optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentAnalyses.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity yet. Start analyzing recipes to see your activity here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {analysis.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {analysis.recipeUrl}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(analysis.createdAt)}
                        </p>
                      </div>
                      <div className="ml-4">
                        {analysis.seoScore ? (
                          <Badge variant={getScoreBadgeVariant(analysis.seoScore)}>
                            {analysis.seoScore}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push('/history')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
