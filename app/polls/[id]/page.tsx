"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ArrowLeft, Share2, Users, Calendar } from "lucide-react"

// Mock poll data - replace with real API later
const mockPollData = {
  "1": {
    id: "1",
    title: "Favorite Programming Language",
    description: "What's your preferred programming language for web development?",
    status: "active",
    createdAt: "2024-01-15",
    createdBy: "John Doe",
    totalVotes: 42,
    options: [
      { id: "opt1", text: "JavaScript", votes: 18 },
      { id: "opt2", text: "Python", votes: 12 },
      { id: "opt3", text: "TypeScript", votes: 8 },
      { id: "opt4", text: "Go", votes: 4 }
    ]
  }
}

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  createdBy: string
  totalVotes: number
  options: PollOption[]
}

export default function PollViewPage() {
  const params = useParams()
  const pollId = params.id as string
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    // Mock data loading - replace with real API call
    const pollData = mockPollData[pollId as keyof typeof mockPollData]
    if (pollData) {
      setPoll(pollData)
    }
  }, [pollId])

  const handleVote = async () => {
    if (!selectedOption || !poll) return
    
    setIsVoting(true)
    
    // Mock voting - replace with real API call
    setTimeout(() => {
      console.log("Voting for option:", selectedOption)
      setHasVoted(true)
      setIsVoting(false)
      
      // Update poll data with new vote
      const updatedPoll = {
        ...poll,
        totalVotes: poll.totalVotes + 1,
        options: poll.options.map(option => 
          option.id === selectedOption 
            ? { ...option, votes: option.votes + 1 }
            : option
        )
      }
      setPoll(updatedPoll)
    }, 1000)
  }

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Poll link copied to clipboard!")
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Poll Not Found</h2>
          <p className="text-gray-600 mb-4">The poll you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
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
                  <span>{poll.totalVotes} votes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {poll.createdAt}</span>
                </div>
                <span>by {poll.createdBy}</span>
              </div>
              <Badge variant={poll.status === "active" ? "default" : "secondary"}>
                {poll.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Voting Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {hasVoted ? "Poll Results" : "Cast Your Vote"}
            </CardTitle>
            <CardDescription>
              {hasVoted 
                ? "Thank you for voting! Here are the current results."
                : "Select an option below to vote."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {poll.options.map((option) => {
              const percentage = getVotePercentage(option.votes, poll.totalVotes)
              const isSelected = selectedOption === option.id
              
              return (
                <div key={option.id} className="space-y-2">
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      hasVoted
                        ? "bg-gray-50 cursor-default"
                        : isSelected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => !hasVoted && setSelectedOption(option.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{option.text}</span>
                      {hasVoted && (
                        <span className="text-sm text-gray-600">
                          {option.votes} votes ({percentage}%)
                        </span>
                      )}
                    </div>
                    {hasVoted && (
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {!hasVoted && poll.status === "active" && (
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
            
            {poll.status !== "active" && !hasVoted && (
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