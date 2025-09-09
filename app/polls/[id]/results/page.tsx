"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { useAuth } from "@/components/auth/auth-provider"
import { DatabaseService } from "@/lib/database.service"
import { ArrowLeft, Share2, Users, Calendar, Trophy } from "lucide-react"
import type { PollWithUserVote } from "@/lib/database.types"

export default function PollResultsPage() {
  const params = useParams()
  const { user } = useAuth()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PollWithUserVote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setIsLoading(true)
        const pollData = await DatabaseService.getPollById(pollId, user?.id)
        if (pollData) {
          setPoll(pollData)
        } else {
          setError("Poll not found")
        }
      } catch (err) {
        console.error('Failed to fetch poll:', err)
        setError("Failed to load poll results")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoll()
  }, [pollId, user?.id])

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Poll results link copied to clipboard!")
  }

  const getWinningOption = () => {
    if (!poll || poll.poll_options.length === 0) return null
    return poll.poll_options.reduce((prev, current) => 
      (current.vote_count || 0) > (prev.vote_count || 0) ? current : prev
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageWrapper maxWidth="xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading poll results...</p>
            </div>
          </div>
        </PageWrapper>
      </MainLayout>
    )
  }

  if (error || !poll) {
    return (
      <MainLayout>
        <PageWrapper maxWidth="xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Poll Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The poll you're looking for doesn't exist."}</p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </PageWrapper>
      </MainLayout>
    )
  }

  const winningOption = getWinningOption()

  return (
    <MainLayout>
      <PageWrapper maxWidth="xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/polls/${pollId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Poll
          </Link>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{poll.title} - Results</h1>
              {poll.description && (
                <p className="text-gray-600 mt-2">{poll.description}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleShare} className="ml-4">
              <Share2 className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>

        {/* Poll Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{poll.total_votes} total votes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant={poll.status === "active" ? "default" : "secondary"}>
                {poll.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        {user && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">Thank you for voting! Here are the current results.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Results</CardTitle>
            <CardDescription>
              {poll.total_votes === 0 
                ? "No votes have been cast yet."
                : `Based on ${poll.total_votes} vote${poll.total_votes === 1 ? '' : 's'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...poll.poll_options]
              .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
              .map((option, index) => {
                const percentage = getVotePercentage(option.vote_count || 0, poll.total_votes)
                const isWinning = winningOption && option.id === winningOption.id && poll.total_votes > 0
                const hasUserVoted = option.user_voted || false
                
                return (
                  <div key={option.id} className="space-y-2">
                    <div className={`p-4 rounded-lg border ${
                      isWinning 
                        ? "bg-yellow-50 border-yellow-300" 
                        : hasUserVoted
                        ? "bg-blue-50 border-blue-300"
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">#{index + 1}</span>
                          <span className="font-medium">
                            {option.text}
                            {isWinning && <Trophy className="inline h-4 w-4 ml-2 text-yellow-600" />}
                            {hasUserVoted && <span className="ml-2 text-blue-600">✓ Your vote</span>}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {option.vote_count || 0} vote{(option.vote_count || 0) === 1 ? '' : 's'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isWinning 
                              ? "bg-yellow-500" 
                              : hasUserVoted
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href={`/polls/${pollId}`}>
            <Button variant="outline">
              View Poll Details
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </PageWrapper>
    </MainLayout>
  )
}