'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Users, 
  BarChart3, 
  Crown,
  Palette,
  Code,
  Phone,
  Building
} from 'lucide-react'
import WhiteLabelSettings from '@/components/agency/white-label-settings'
import TeamManagement from '@/components/agency/team-management'
import ApiIntegrations from '@/components/agency/api-integrations'
// import AgencySupport from '@/components/agency/agency-support'

interface AgencyStats {
  totalAnalyses: number
  teamMembers: number
  apiCalls: number
  organizationId: string
}

export default function AgencyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<AgencyStats | null>(null)
  const [whiteLabelSettings, setWhiteLabelSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('branding')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    // Check for tab parameter in URL
    const tab = searchParams.get('tab')
    if (tab && ['branding', 'team', 'integrations', 'support'].includes(tab)) {
      setActiveTab(tab)
    }

    // Check if user has agency subscription
    checkAgencyAccess()
    fetchAgencyStats()
    fetchWhiteLabelSettings()
  }, [session, status, searchParams])

  const checkAgencyAccess = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      const data = await response.json()
      
      if (!response.ok || data.subscriptionTier !== 'agency') {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking agency access:', error)
      router.push('/dashboard')
    }
  }

  const fetchAgencyStats = async () => {
    try {
      const response = await fetch('/api/agency/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching agency stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWhiteLabelSettings = async () => {
    try {
      const response = await fetch('/api/agency/white-label')
      const data = await response.json()
      
      if (response.ok) {
        setWhiteLabelSettings(data)
      }
    } catch (error) {
      console.error('Error fetching white-label settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading Agency Dashboard...</p>
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
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agency Dashboard</h1>
                <p className="text-gray-600">Advanced features and team management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-orange-100 text-orange-800 px-3 py-1">
                <Crown className="w-4 h-4 mr-1" />
                Agency Plan
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalAnalyses || 0}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.teamMembers || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Calls</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.apiCalls || 0}
                  </p>
                </div>
                <Code className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usage</p>
                  <p className="text-2xl font-bold text-green-600">
                    Unlimited
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              API & Webhooks
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <WhiteLabelSettings 
              userId={session?.user?.id || ''}
              currentSettings={whiteLabelSettings}
              onUpdate={setWhiteLabelSettings}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement organizationId={stats?.organizationId || ''} />
          </TabsContent>

          <TabsContent value="integrations">
            <ApiIntegrations />
          </TabsContent>

          <TabsContent value="support">
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Agency Support</h3>
              <p className="text-gray-600 mb-4">Premium phone support coming soon!</p>
              <p className="text-sm text-gray-500">Call +1 (555) 123-4567 for immediate assistance</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}