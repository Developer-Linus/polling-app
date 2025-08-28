"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"

// Mock poll data - replace with real API later
const mockPollData = {
  "1": {
    id: "1",
    title: "Favorite Programming Language",
    description: "What's your preferred programming language for web development?",
    status: "active",
    createdAt: "2024-01-15",
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
  totalVotes: number
  options: PollOption[]
}

export default function EditPollPage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<PollOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Mock data loading - replace with real API call
    const pollData = mockPollData[pollId as keyof typeof mockPollData]
    if (pollData) {
      setPoll(pollData)
      setTitle(pollData.title)
      setDescription(pollData.description)
      setOptions([...pollData.options])
    }
    setIsLoading(false)
  }, [pollId])

  const addOption = () => {
    const newOption: PollOption = {
      id: `opt${Date.now()}`,
      text: "",
      votes: 0
    }
    setOptions([...options, newOption])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id))
    }
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Mock poll update - replace with real API later
    const updatedPoll = {
      ...poll!,
      title,
      description,
      options: options.filter(option => option.text.trim() !== "")
    }

    setTimeout(() => {
      console.log("Updating poll:", updatedPoll)
      setIsSaving(false)
      router.push(`/polls/${pollId}`)
    }, 1000)
  }

  const togglePollStatus = () => {
    if (poll) {
      const newStatus = poll.status === "active" ? "closed" : "active"
      setPoll({ ...poll, status: newStatus })
    }
  }

  const deletePoll = () => {
    if (confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      // Mock poll deletion - replace with real API later
      console.log("Deleting poll:", pollId)
      router.push("/dashboard")
    }
  }

  const isFormValid = title.trim() !== "" && 
    options.filter(option => option.text.trim() !== "").length >= 2

  const hasVotes = poll && poll.totalVotes > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Poll Not Found</h2>
          <p className="text-gray-600 mb-4">The poll you're trying to edit doesn't exist.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageWrapper maxWidth="lg">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/polls/${pollId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Poll
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Poll</h1>
              <p className="text-gray-600 mt-2">Make changes to your poll</p>
            </div>
            <Badge variant={poll.status === "active" ? "default" : "secondary"}>
              {poll.status}
            </Badge>
          </div>
        </div>

        {/* Poll Stats */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{poll.totalVotes}</span> total votes
                <span className="mx-2">•</span>
                Created {poll.createdAt}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePollStatus}
                >
                  {poll.status === "active" ? "Close Poll" : "Reopen Poll"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deletePoll}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              {hasVotes 
                ? "Note: This poll has received votes. Some changes may affect existing results."
                : "Edit your poll details and options."
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-6">
              {/* Poll Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your poll title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Poll Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Add a description for your poll"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Poll Options *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option.text}
                            onChange={(e) => updateOption(option.id, e.target.value)}
                          />
                        </div>
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(option.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {hasVotes && option.votes > 0 && (
                        <p className="text-xs text-gray-500 ml-1">
                          Current votes: {option.votes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6">
                <Link href={`/polls/${pollId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
        </PageWrapper>
      </MainLayout>
    </ProtectedRoute>
  )
}