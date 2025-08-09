'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Users, Plus, Mail, Trash2, Settings } from 'lucide-react'

interface TeamMember {
  id: string
  user: {
    name: string
    email: string
    image?: string
  }
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
}

interface TeamManagementProps {
  organizationId: string
}

export default function TeamManagement({ organizationId }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER')
  const [loading, setLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [organizationId])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/agency/team?organizationId=${organizationId}`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/agency/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        alert('Team member invited successfully!')
        setInviteEmail('')
        setInviteOpen(false)
        fetchTeamMembers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to invite team member')
      }
    } catch (error) {
      console.error('Error inviting team member:', error)
      alert('Error sending invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/agency/team/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTeamMembers()
      } else {
        alert('Failed to remove team member')
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Error removing team member')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/agency/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        fetchTeamMembers()
      } else {
        alert('Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error updating role')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-blue-100 text-blue-800'
      case 'MEMBER': return 'bg-green-100 text-green-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer - Can view analyses</SelectItem>
                        <SelectItem value="MEMBER">Member - Can create and view analyses</SelectItem>
                        <SelectItem value="ADMIN">Admin - Full access except billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleInvite} 
                    disabled={loading || !inviteEmail.trim()}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {member.user.image && (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name} 
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-600">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {member.role !== 'OWNER' && (
                        <>
                          <Select 
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No team members yet. Invite your first team member to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Permission Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Owner</div>
                <div className="text-sm text-gray-600">Full access to all features and billing</div>
              </div>
              <Badge className={getRoleColor('OWNER')}>OWNER</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-sm text-gray-600">Can manage team, create analyses, and access all features</div>
              </div>
              <Badge className={getRoleColor('ADMIN')}>ADMIN</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Member</div>
                <div className="text-sm text-gray-600">Can create and view analyses</div>
              </div>
              <Badge className={getRoleColor('MEMBER')}>MEMBER</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Viewer</div>
                <div className="text-sm text-gray-600">Can only view shared analyses</div>
              </div>
              <Badge className={getRoleColor('VIEWER')}>VIEWER</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}