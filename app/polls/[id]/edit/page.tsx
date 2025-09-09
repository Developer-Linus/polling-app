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
import { useAuth } from "@/components/auth/auth-provider"
import { DatabaseService } from "@/lib/database.service"
import { PollWithUserVote } from "@/lib/database.types"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { EditablePollOption } from "@/lib/types"

export default function EditPollPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<PollWithUserVote | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<EditablePollOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load poll data on component mount
  useEffect(() => {
    const loadPoll = async () => {
      if (!user) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const pollData = await DatabaseService.getPollById(pollId, user.id)
        
        if (!pollData) {
          setError("Poll not found")
          return
        }
        
        // Check if user owns this poll
        if (pollData.created_by !== user.id) {
          setError("You don't have permission to edit this poll")
          return
        }
        
        setPoll(pollData)
        setTitle(pollData.title)
        setDescription(pollData.description || "")
        
        // Convert poll options to editable format
        const editableOptions: EditablePollOption[] = pollData.poll_options.map(option => ({
          id: option.id,
          text: option.text,
          vote_count: option.vote_count,
          position: option.position
        }))
        setOptions(editableOptions)
        
      } catch (err) {
        console.error("Error loading poll:", err)
        setError("Failed to load poll")
      } finally {
        setIsLoading(false)
      }
    }

    loadPoll()
  }, [pollId, user])

  const addOption = () => {
    const newOption: EditablePollOption = {
      id: `opt${Date.now()}`,
      text: "",
      vote_count: 0,
      position: options.length
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
    
    if (!isFormValid || !user || !poll) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      // Filter out empty options and prepare for update
      const validOptions = options
        .filter(opt => opt.text.trim() !== "")
        .map((opt, index) => ({
          id: opt.id,
          text: opt.text.trim(),
          position: index
        }))
      
      await DatabaseService.updatePoll(pollId, {
        title: title.trim(),
        description: description.trim() || null,
        options: validOptions
      }, user.id)
      
      router.push(`/polls/${pollId}`)
    } catch (err) {
      console.error("Error saving poll:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save poll changes"
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePollStatus = async () => {
    if (!poll || !user) return
    
    try {
      const newStatus = poll.status === 'active' ? 'closed' : 'active'
      const isActive = newStatus === 'active'
      await DatabaseService.updatePollStatus(pollId, isActive, user.id)
      setPoll({ ...poll, status: newStatus })
    } catch (err) {
      console.error("Error toggling poll status:", err)
      setError("Failed to update poll status")
    }
  }

  const deletePoll = async () => {
    if (!user || !poll) return
    
    if (confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      try {
        await DatabaseService.deletePoll(pollId, user.id)
        router.push("/dashboard")
      } catch (err) {
        console.error("Error deleting poll:", err)
        setError("Failed to delete poll")
      }
    }
  }

  const isFormValid = title.trim() !== "" && 
    options.filter(option => option.text.trim() !== "").length >= 2

  const hasVotes = poll && poll.total_votes > 0

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

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error === "You don't have permission to edit this poll" ? "Access Denied" : "Poll Not Found"}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The poll you're trying to edit doesn't exist."}
          </p>
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
            <Badge variant={poll.status === 'active' ? "default" : "secondary"}>
              {poll.status}
            </Badge>
          </div>
        </div>

        {/* Poll Stats */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{poll.total_votes}</span> total votes
                <span className="mx-2">•</span>
                Created {new Date(poll.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePollStatus}
                >
                  {poll.status === 'active' ? "Close Poll" : "Reopen Poll"}
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
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
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
                      {hasVotes && option.vote_count > 0 && (
                        <p className="text-xs text-gray-500 ml-1">
                          Current votes: {option.vote_count}
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