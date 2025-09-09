"use client"

// React core imports
import { useEffect, useState, useMemo, useCallback, memo } from "react"
import Link from "next/link"

// UI component imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Layout component imports
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Authentication and data imports
import { useAuth } from "@/components/auth/auth-provider"
import { DatabaseService } from "@/lib/database.service"
import { PollWithResults } from "@/lib/database.types"

// Icon imports
import { Plus, BarChart3, Users, Eye, Edit, Trash2 } from "lucide-react"

/**
 * Maps poll status to appropriate badge color variant
 * @param status - The poll status ('active', 'closed', 'draft')
 * @returns Badge variant string for consistent UI styling
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "default" // Green badge for active polls
    case "closed":
      return "secondary" // Gray badge for closed polls
    case "draft":
      return "outline" // Outlined badge for draft polls
    default:
      return "outline" // Fallback to outline for unknown status
  }
}

/**
 * Interface for poll statistics to ensure type safety
 */
interface PollStats {
  totalPolls: number
  totalResponses: number
  activePolls: number
}

/**
 * Interface for dashboard state management
 */
interface DashboardState {
  polls: PollWithResults[]
  isLoading: boolean
  error: string | null
  deletingPollId: string | null
}

/**
 * Props interface for PollCard component
 */
interface PollCardProps {
  poll: PollWithResults
  onDelete: (pollId: string) => void
  isDeleting: boolean
}

/**
 * Memoized PollCard component to prevent unnecessary re-renders
 * Only re-renders when poll data, delete handler, or deleting state changes
 * 
 * @param poll - Poll data object
 * @param onDelete - Callback function to handle poll deletion
 * @param isDeleting - Boolean indicating if this poll is currently being deleted
 */
const PollCard = memo<PollCardProps>(({ poll, onDelete, isDeleting }) => {
  // Memoize delete handler to prevent recreation on every render
  const handleDelete = useCallback(() => {
    onDelete(poll.id)
  }, [poll.id, onDelete])

  // Format creation date once to avoid repeated calculations
  const formattedDate = useMemo(() => {
    return new Date(poll.created_at).toLocaleDateString()
  }, [poll.created_at])

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0"> {/* min-w-0 prevents flex item from overflowing */}
            <CardTitle className="text-lg truncate">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant={getStatusColor(poll.status)}
            className="ml-2 flex-shrink-0" // Prevent badge from shrinking
          >
            {poll.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center flex-wrap gap-2">
          {/* Poll metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{poll.total_votes || 0} responses</span>
            <span>Created {formattedDate}</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Link href={`/polls/${poll.id}`}>
              <Button variant="outline" size="sm" className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <Link href={`/polls/${poll.id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:border-red-300 flex items-center"
              aria-label={`Delete poll: ${poll.title}`}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PollCard.displayName = 'PollCard'

/**
 * Custom hook for managing dashboard state and poll operations
 * Separates business logic from UI rendering for better maintainability
 */
const useDashboard = (userId: string | undefined) => {
  // State management with proper typing
  const [state, setState] = useState<DashboardState>({
    polls: [],
    isLoading: true,
    error: null,
    deletingPollId: null
  })

  /**
   * Fetches user polls from the database
   * Handles loading states and error management
   */
  const fetchPolls = useCallback(async () => {
    if (!userId) return
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const userPolls = await DatabaseService.getUserPolls(userId)
      setState(prev => ({ ...prev, polls: userPolls.polls, isLoading: false }))
    } catch (err) {
      console.error('Failed to fetch polls:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load polls'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [userId])

  /**
   * Handles poll deletion with optimistic updates
   * @param pollId - ID of the poll to delete
   */
  const deletePoll = useCallback(async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    if (!userId) {
      setState(prev => ({ ...prev, error: 'You must be logged in to delete polls' }))
      return
    }

    try {
      setState(prev => ({ ...prev, deletingPollId: pollId }))
      await DatabaseService.deletePoll(pollId, userId)
      
      // Optimistic update: remove poll from local state immediately
      setState(prev => ({
        ...prev,
        polls: prev.polls.filter(poll => poll.id !== pollId),
        deletingPollId: null
      }))
    } catch (err) {
      console.error('Failed to delete poll:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete poll'
      setState(prev => ({ ...prev, error: errorMessage, deletingPollId: null }))
    }
  }, [userId])

  // Fetch polls when userId changes
  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  return {
    ...state,
    deletePoll,
    refetchPolls: fetchPolls
  }
}

/**
 * Custom hook for calculating poll statistics
 * Memoizes expensive calculations to prevent unnecessary recalculations
 */
const usePollStats = (polls: PollWithResults[]): PollStats => {
  return useMemo(() => {
    if (!Array.isArray(polls)) {
      return { totalPolls: 0, totalResponses: 0, activePolls: 0 }
    }
    
    return {
      totalPolls: polls.length,
      totalResponses: polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0),
      activePolls: polls.filter(poll => poll.status === "active").length
    }
  }, [polls])
}

/**
 * Main Dashboard Page Component
 * Displays user polls with statistics and management capabilities
 */
export default function DashboardPage() {
  const { user } = useAuth()
  
  // Use custom hooks for state management and statistics
  const { polls, isLoading, error, deletingPollId, deletePoll } = useDashboard(user?.id)
  const pollStats = usePollStats(polls)

  // Memoize delete handler to prevent PollCard re-renders
  const handleDeletePoll = useCallback((pollId: string) => {
    deletePoll(pollId)
  }, [deletePoll])

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageWrapper>
          {/* Dashboard Header Section */}
          <DashboardHeader />

          {/* Statistics Cards Section */}
          <StatsCards stats={pollStats} isLoading={isLoading} />

          {/* Polls Management Section */}
          <PollsList 
            polls={polls}
            isLoading={isLoading}
            error={error}
            onDeletePoll={handleDeletePoll}
            deletingPollId={deletingPollId}
          />
        </PageWrapper>
      </MainLayout>
    </ProtectedRoute>
  )
}

/**
 * Dashboard Header Component
 * Displays page title and create poll button
 */
const DashboardHeader = memo(() => (
  <div className="mb-8">
    <div className="flex justify-between items-center flex-wrap gap-4">
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
))

DashboardHeader.displayName = 'DashboardHeader'

/**
 * Statistics Cards Component
 * Displays poll statistics in a responsive grid
 */
interface StatsCardsProps {
  stats: PollStats
  isLoading: boolean
}

const StatsCards = memo<StatsCardsProps>(({ stats, isLoading }) => {
  const statsConfig = [
    {
      title: 'Total Polls',
      value: stats.totalPolls,
      description: 'Your created polls',
      icon: BarChart3
    },
    {
      title: 'Total Responses',
      value: stats.totalResponses,
      description: 'Across all your polls',
      icon: Users
    },
    {
      title: 'Active Polls',
      value: stats.activePolls,
      description: 'Currently collecting responses',
      icon: Eye
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statsConfig.map(({ title, value, description, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

StatsCards.displayName = 'StatsCards'

/**
 * Polls List Component
 * Handles different states: loading, error, empty, and populated
 */
interface PollsListProps {
  polls: PollWithResults[]
  isLoading: boolean
  error: string | null
  onDeletePoll: (pollId: string) => void
  deletingPollId: string | null
}

const PollsList = memo<PollsListProps>(({ 
  polls, 
  isLoading, 
  error, 
  onDeletePoll, 
  deletingPollId 
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
    
    {/* Error State */}
    {error && (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700" role="alert">{error}</p>
        </CardContent>
      </Card>
    )}
    
    {/* Loading State */}
    {isLoading && (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"
            aria-label="Loading polls"
          />
          <p className="text-gray-600">Loading your polls...</p>
        </div>
      </div>
    )}
    
    {/* Empty State */}
    {!isLoading && !error && Array.isArray(polls) && polls.length === 0 && (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <div className="max-w-sm mx-auto">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You haven't created any polls yet.</p>
            <p className="text-sm text-gray-500 mb-6">
              Create your first poll to start collecting responses from your audience.
            </p>
            <Link href="/polls/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Poll
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )}
    
    {/* Polls Grid */}
    {!isLoading && !error && Array.isArray(polls) && polls.length > 0 && (
      <div className="grid gap-4">
        {polls.map((poll) => (
          <PollCard 
            key={poll.id} 
            poll={poll} 
            onDelete={onDeletePoll}
            isDeleting={deletingPollId === poll.id}
          />
        ))}
      </div>
    )}
  </div>
))

PollsList.displayName = 'PollsList'