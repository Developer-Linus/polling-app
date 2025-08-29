"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { DatabaseService } from "@/lib/database.service"
import { Poll } from "@/lib/database.types"
import { Plus, BarChart3, Users, Eye, Edit, Trash2 } from "lucide-react"

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "default"
    case "closed":
      return "secondary"
    case "draft":
      return "outline"
    default:
      return "outline"
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPolls = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        setError(null)
        const userPolls = await DatabaseService.getUserPolls(user.id)
        setPolls(userPolls.polls)
      } catch (err) {
        console.error('Failed to fetch polls:', err)
        setError(err instanceof Error ? err.message : 'Failed to load polls')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolls()
  }, [user?.id])

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    if (!user?.id) {
      setError('You must be logged in to delete polls')
      return
    }

    try {
      setDeletingPollId(pollId)
      await DatabaseService.deletePoll(pollId, user.id)
      setPolls(polls.filter(poll => poll.id !== pollId))
    } catch (err) {
      console.error('Failed to delete poll:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete poll')
    } finally {
      setDeletingPollId(null)
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageWrapper>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your polls and view analytics</p>
            </div>
            <Link href="/polls/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Poll
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : Array.isArray(polls) ? polls.length : 0}</div>
              <p className="text-xs text-muted-foreground">Your created polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : Array.isArray(polls) ? polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Across all your polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : Array.isArray(polls) ? polls.filter(poll => poll.status === "active").length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently collecting responses</p>
            </CardContent>
          </Card>
        </div>

        {/* Polls List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
          
          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your polls...</p>
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && !error && Array.isArray(polls) && polls.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any polls yet.</p>
                <Link href="/polls/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Poll
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          {/* Polls Grid */}
          {!isLoading && !error && Array.isArray(polls) && polls.length > 0 && (
            <div className="grid gap-4">
              {polls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{poll.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {poll.description}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(poll.status)}>
                        {poll.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{poll.total_votes || 0} responses</span>
                        <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/polls/${poll.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/polls/${poll.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePoll(poll.id)}
                          disabled={deletingPollId === poll.id}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingPollId === poll.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </PageWrapper>
      </MainLayout>
    </ProtectedRoute>
  )
}