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
import { ArrowLeft, Share2, Users, Calendar } from "lucide-react"
import type { PollWithUserVote } from "@/lib/database.types"

export default function PollViewPage() {
  const params = useParams()
  const { user } = useAuth()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PollWithUserVote | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
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
        setError("Failed to load poll")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoll()
  }, [pollId, user?.id])

  const handleVote = async () => {
    if (!selectedOption || !poll || !user) return
    
    setIsVoting(true)
    
    try {
      await DatabaseService.vote(poll.id, { option_ids: [selectedOption] }, user.id)
      
      // Refresh poll data to get updated vote counts
      const updatedPoll = await DatabaseService.getPollById(poll.id, user.id)
      if (updatedPoll) {
        setPoll(updatedPoll)
      }
    } catch (err) {
      console.error('Failed to vote:', err)
      setError(err instanceof Error ? err.message : 'Failed to vote. Please try again.')
    } finally {
      setIsVoting(false)
    }
  }

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Poll link copied to clipboard!")
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageWrapper maxWidth="xl">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading poll...</p>
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

  return (
    <MainLayout>
      <PageWrapper maxWidth="xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 mt-2">{poll.description}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleShare} className="ml-4">
              <Share2 className="h-4 w-4 mr-2" />
              Share
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
                  <span>{poll.total_votes} votes</span>
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

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {!poll.user_can_vote ? "Poll Results" : "Cast Your Vote"}
            </CardTitle>
            <CardDescription>
              {!poll.user_can_vote 
                ? "Here are the current results."
                : "Select an option below to vote."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {poll.poll_options.map((option) => {
              const percentage = getVotePercentage(option.vote_count || 0, poll.total_votes)
              const isSelected = selectedOption === option.id
              const hasUserVoted = option.user_voted || false
              
              return (
                <div key={option.id} className="space-y-2">
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      !poll.user_can_vote
                        ? "bg-gray-50 cursor-default"
                        : isSelected
                        ? "bg-blue-50 border-blue-300"
                        : hasUserVoted
                        ? "bg-green-50 border-green-300"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => poll.user_can_vote && setSelectedOption(option.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {option.text}
                        {hasUserVoted && <span className="ml-2 text-green-600">✓</span>}
                      </span>
                      <span className="text-sm text-gray-600">
                        {option.vote_count || 0} votes ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            
            {poll.user_can_vote && user && (
              <div className="pt-4">
                <Button 
                  onClick={handleVote}
                  disabled={!selectedOption || isVoting}
                  className="w-full"
                >
                  {isVoting ? "Submitting Vote..." : "Submit Vote"}
                </Button>
              </div>
            )}
            
            {!user && (
              <div className="pt-4 text-center text-gray-600">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
                  Sign in to vote
                </Link>
              </div>
            )}
            
            {user && !poll.user_can_vote && poll.status === "active" && (
              <div className="pt-4 text-center text-gray-600">
                You have already voted in this poll.
              </div>
            )}
            
            {poll.status !== "active" && (
              <div className="pt-4 text-center text-gray-600">
                This poll is no longer accepting votes.
              </div>
            )}
          </CardContent>
        </Card>
      </PageWrapper>
    </MainLayout>
  )
}