'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, Palette, Globe, Save } from 'lucide-react'

interface WhiteLabelSettings {
  companyName?: string
  companyLogo?: string
  primaryColor?: string
  customDomain?: string
}

interface WhiteLabelSettingsProps {
  userId: string
  currentSettings: WhiteLabelSettings
  onUpdate: (settings: WhiteLabelSettings) => void
}

export default function WhiteLabelSettings({ 
  userId, 
  currentSettings, 
  onUpdate 
}: WhiteLabelSettingsProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(currentSettings)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/agency/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        onUpdate(settings)
        alert('White-label settings updated successfully!')
      } else {
        alert('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Error updating settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            White-Label Branding
          </CardTitle>
          <CardDescription>
            Customize the appearance of your RecipeRankPro dashboard with your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Your Company Name"
              value={settings.companyName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="companyLogo"
                placeholder="https://your-domain.com/logo.png"
                value={settings.companyLogo || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, companyLogo: e.target.value }))}
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {settings.companyLogo && (
              <div className="mt-2">
                <img 
                  src={settings.companyLogo} 
                  alt="Company Logo Preview" 
                  className="h-12 w-auto object-contain border rounded"
                  onError={() => setSettings(prev => ({ ...prev, companyLogo: '' }))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Brand Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={settings.primaryColor || '#f97316'}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                placeholder="#f97316"
                value={settings.primaryColor || '#f97316'}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <div className="flex gap-2">
              <Globe className="w-5 h-5 text-gray-400 mt-2" />
              <div className="flex-1">
                <Input
                  id="customDomain"
                  placeholder="analytics.your-domain.com"
                  value={settings.customDomain || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Contact support to configure DNS settings for your custom domain
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save White-Label Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your branding will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${settings.primaryColor || '#f97316'}10`,
              borderColor: settings.primaryColor || '#f97316'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {settings.companyLogo && (
                <img 
                  src={settings.companyLogo} 
                  alt="Logo" 
                  className="h-8 w-auto object-contain"
                />
              )}
              <span className="font-semibold text-lg">
                {settings.companyName || 'Your Company'} Analytics
              </span>
            </div>
            <div className="space-y-2">
              <div 
                className="h-3 rounded"
                style={{ backgroundColor: settings.primaryColor || '#f97316' }}
              />
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}