'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Key, 
  Webhook, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2,
  ExternalLink,
  Code
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPreview: string
  createdAt: string
  lastUsed?: string
}

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}

export default function ApiIntegrations() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [showKey, setShowKey] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const availableEvents = [
    'analysis.completed',
    'analysis.failed',
    'user.subscribed',
    'team.member.added',
    'usage.limit.reached'
  ]

  useEffect(() => {
    fetchApiKeys()
    fetchWebhooks()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/agency/integrations/api-keys')
      const data = await response.json()
      if (response.ok) {
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/agency/integrations/webhooks')
      const data = await response.json()
      if (response.ok) {
        setWebhooks(data.webhooks)
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/agency/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })

      if (response.ok) {
        const data = await response.json()
        setApiKeys(prev => [...prev, data.apiKey])
        setNewKeyName('')
        alert(`API Key created: ${data.fullKey}\n\nSave this key securely - you won't see it again!`)
      }
    } catch (error) {
      console.error('Error creating API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/agency/integrations/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId))
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  const createWebhook = async () => {
    if (!newWebhookUrl.trim() || selectedEvents.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/agency/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: newWebhookUrl,
          events: selectedEvents
        })
      })

      if (response.ok) {
        const data = await response.json()
        setWebhooks(prev => [...prev, data.webhook])
        setNewWebhookUrl('')
        setSelectedEvents([])
        alert('Webhook endpoint created successfully!')
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const response = await fetch(`/api/agency/integrations/webhooks/${webhookId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWebhooks(prev => prev.filter(w => w.id !== webhookId))
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Integrations
          </CardTitle>
          <CardDescription>
            Connect RecipeRankPro with your applications using APIs and webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">API Keys</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key to authenticate your applications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="Production Server, Staging, etc."
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={createApiKey} 
                        disabled={loading || !newKeyName.trim()}
                        className="w-full"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {loading ? 'Creating...' : 'Create API Key'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {showKey === key.id ? key.keyPreview : '••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                          >
                            {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {apiKeys.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No API keys created yet. Create your first API key to get started.
                </div>
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Webhook Endpoints</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Webhook Endpoint</DialogTitle>
                      <DialogDescription>
                        Add a webhook endpoint to receive real-time notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Endpoint URL</Label>
                        <Input
                          id="webhookUrl"
                          placeholder="https://your-app.com/webhooks/reciperank"
                          value={newWebhookUrl}
                          onChange={(e) => setNewWebhookUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Events to Subscribe</Label>
                        <div className="space-y-2">
                          {availableEvents.map((event) => (
                            <div key={event} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={event}
                                checked={selectedEvents.includes(event)}
                                onChange={() => toggleEvent(event)}
                                className="rounded"
                              />
                              <Label htmlFor={event} className="text-sm font-normal">
                                {event}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={createWebhook} 
                        disabled={loading || !newWebhookUrl.trim() || selectedEvents.length === 0}
                        className="w-full"
                      >
                        <Webhook className="w-4 h-4 mr-2" />
                        {loading ? 'Creating...' : 'Create Webhook'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {webhook.url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(webhook.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {webhooks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No webhooks configured yet. Add your first webhook endpoint to get started.
                </div>
              )}
            </TabsContent>

            <TabsContent value="documentation" className="space-y-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      API Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Base URL</h4>
                      <code className="bg-gray-100 px-3 py-2 rounded block">
                        https://api.reciperank.pro/v1
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Authentication</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Include your API key in the Authorization header:
                      </p>
                      <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                        Authorization: Bearer your_api_key_here
                      </code>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Available Endpoints</h4>
                      <div className="space-y-2 text-sm">
                        <div><code>POST /analyze</code> - Create new recipe analysis</div>
                        <div><code>GET /analyses</code> - List your analyses</div>
                        <div><code>GET /analyses/:id</code> - Get specific analysis</div>
                        <div><code>GET /usage</code> - Check usage statistics</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <code className="font-medium">analysis.completed</code>
                        <p className="text-gray-600 ml-4">Sent when a recipe analysis finishes successfully</p>
                      </div>
                      <div>
                        <code className="font-medium">analysis.failed</code>
                        <p className="text-gray-600 ml-4">Sent when a recipe analysis fails</p>
                      </div>
                      <div>
                        <code className="font-medium">usage.limit.reached</code>
                        <p className="text-gray-600 ml-4">Sent when monthly usage limit is reached</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}