'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Activity,
  CreditCard,
  ExternalLink,
  Crown,
  Zap,
  Palette,
  Users,
  Code,
  Phone
} from 'lucide-react'

interface DashboardStats {
  recipesAnalyzed: number
  seoScoreAverage: number
  totalRecipes: number
  recentActivity: Array<{
    id: string
    title: string
    url: string
    seoScore: number
    createdAt: string
  }>
}

interface SubscriptionInfo {
  subscription: {
    planId: string
    status: string
    currentPeriodEnd: string
  } | null
  usage: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<string>('starter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
      fetchSubscriptionData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription')
      const data = await response.json()
      setSubscription(data)
      
      // Also fetch subscription tier
      const tierResponse = await fetch('/api/user/subscription')
      const tierData = await tierResponse.json()
      if (tierResponse.ok) {
        setSubscriptionTier(tierData.subscriptionTier)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      })
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    }
  }

  const getPlanInfo = (planId: string) => {
    const plans = {
      starter: { name: 'Starter', limit: 10, color: 'bg-blue-500', icon: Zap },
      pro: { name: 'Pro', limit: 50, color: 'bg-purple-500', icon: TrendingUp },
      agency: { name: 'Agency', limit: -1, color: 'bg-orange-500', icon: Crown }
    }
    return plans[planId as keyof typeof plans] || plans.starter
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.subscription?.planId || 'starter'
  const planInfo = getPlanInfo(currentPlan)
  const usage = subscription?.usage || 0
  const usagePercentage = planInfo.limit === -1 ? 0 : (usage / planInfo.limit) * 100
  const PlanIcon = planInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-gray-900">RecipeRankPro</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {session.user?.name || session.user?.email}</span>
            {(subscriptionTier === 'agency' || subscription?.subscription?.planId?.includes('agency') || planInfo.name === 'Agency') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/agency')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Crown className="w-4 h-4 mr-1" />
                Agency Dashboard
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your RecipeRankPro dashboard</p>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8 border-l-4 border-l-orange-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${planInfo.color} rounded-lg flex items-center justify-center`}>
                  <PlanIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{planInfo.name} Plan</span>
                    {subscription?.subscription?.status === 'trialing' && (
                      <Badge variant="secondary">Free Trial</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {planInfo.limit === -1 ? 'Unlimited analyses' : `${usage}/${planInfo.limit} analyses used this month`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                {subscription?.subscription && (
                  <Button variant="outline" size="sm" onClick={handleBillingPortal}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pricing">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          {planInfo.limit !== -1 && (
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Usage</span>
                  <span>{usage} / {planInfo.limit}</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                {usagePercentage >= 80 && (
                  <p className="text-sm text-orange-600">
                    You're approaching your monthly limit. Consider upgrading your plan.
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipes Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recipesAnalyzed || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SEO Score Average</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.seoScoreAverage || 0}</div>
              <p className="text-xs text-muted-foreground">Across all recipes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <PlanIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{planInfo.name}</div>
              <p className="text-xs text-muted-foreground">
                {planInfo.limit === -1 ? 'Unlimited' : `${planInfo.limit - usage} analyses remaining`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRecipes || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span>Analyze New Recipe</span>
            </CardTitle>
            <CardDescription>
              Ready to optimize your next recipe? Paste a recipe URL and target keyword to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
              <Link href="/analyze">Start Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Agency Features Section */}
        {(subscriptionTier === 'agency' || subscription?.subscription?.planId?.includes('agency') || planInfo.name === 'Agency') && (
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-600" />
                Agency Features
              </h2>
              <Button 
                onClick={() => router.push('/agency')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Open Agency Dashboard
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/agency?tab=branding')}>
                <CardContent className="p-4 text-center">
                  <Palette className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">White-Label</h3>
                  <p className="text-sm text-gray-600">Custom branding & domains</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/agency?tab=team')}>
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Team Collaboration</h3>
                  <p className="text-sm text-gray-600">Manage team members</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/agency?tab=integrations')}>
                <CardContent className="p-4 text-center">
                  <Code className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">API & Webhooks</h3>
                  <p className="text-sm text-gray-600">Custom integrations</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/agency?tab=support')}>
                <CardContent className="p-4 text-center">
                  <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Phone Support</h3>
                  <p className="text-sm text-gray-600">Priority assistance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest recipe analyses and optimizations (click to view details)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Link href={`/analysis/${activity.id}`} className="block">
                        <h4 className="font-medium text-gray-900 hover:text-orange-600 transition-colors">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate max-w-md">{activity.url}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </Link>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={activity.seoScore >= 80 ? 'default' : activity.seoScore >= 60 ? 'secondary' : 'destructive'}
                        className="ml-4"
                      >
                        {activity.seoScore}
                      </Badge>
                      <Link href={`/analysis/${activity.id}`}>
                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-orange-600" />
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/analyses">View All Analyses</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No analyses yet. Start optimizing your recipes!</p>
                <Button asChild>
                  <Link href="/analyze">Analyze Your First Recipe</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
