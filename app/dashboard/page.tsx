import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Target, TrendingUp, Zap, Plus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SignOutButton from './sign-out-button'
import { prisma } from '@/lib/db'

async function getDashboardStats(userId: string) {
  try {
    const analysesResult = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${userId}
    `

    const monthlyAnalysesResult = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${userId} 
      AND "createdAt" >= date_trunc('month', CURRENT_DATE)
    `

    const avgScoreResult = await prisma.$queryRaw<{avg: number | null}[]>`
      SELECT AVG("seoScore") as avg 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${userId} 
      AND "seoScore" IS NOT NULL
    `

    return {
      totalAnalyses: Number(analysesResult[0].count),
      monthlyAnalyses: Number(monthlyAnalysesResult[0].count),
      avgSeoScore: avgScoreResult[0].avg ? Math.round(avgScoreResult[0].avg) : null
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return {
      totalAnalyses: 0,
      monthlyAnalyses: 0,
      avgSeoScore: null
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const stats = await getDashboardStats(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">RecipeRankPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {session.user.name || session.user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Welcome to your RecipeRankPro dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipes Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyAnalyses}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SEO Score Average</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSeoScore || '--'}</div>
              <p className="text-xs text-muted-foreground">Across all recipes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Starter</div>
              <p className="text-xs text-muted-foreground">{10 - stats.monthlyAnalyses} analyses remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-600" />
                Analyze New Recipe
              </CardTitle>
              <CardDescription>
                Ready to optimize your next recipe? Paste a recipe URL and target keyword to get started.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/dashboard/analyze" className="w-full">
                <Button className="w-full">Start Analysis</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                {stats.totalAnalyses > 0 
                  ? "View your recent recipe analyses and optimization results."
                  : "No recent activity yet. Start analyzing recipes to see your activity here!"
                }
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/dashboard/history" className="w-full">
                <Button variant="outline" className="w-full">View History</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {stats.totalAnalyses === 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Get Started with RecipeRankPro</CardTitle>
              <CardDescription>
                Follow these steps to optimize your first recipe and boost your SEO rankings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h4 className="font-medium">Choose a Recipe</h4>
                    <p className="text-sm text-gray-600">Pick a recipe from your food blog that you want to optimize for search engines.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h4 className="font-medium">Enter Your Target Keyword</h4>
                    <p className="text-sm text-gray-600">Think about what people would search for to find your recipe (e.g., "easy chocolate cake recipe").</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h4 className="font-medium">Get AI-Powered Suggestions</h4>
                    <p className="text-sm text-gray-600">Our AI will analyze your recipe and provide optimized titles, descriptions, and SEO suggestions.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/analyze">
                <Button>Analyze Your First Recipe</Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                SEO Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Get optimized titles and meta descriptions that rank higher in search results and attract more clicks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Performance Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor your SEO scores and track improvements across all your recipe optimizations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Schema Markup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automatically generate Recipe schema markup for rich snippets that stand out in search results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
