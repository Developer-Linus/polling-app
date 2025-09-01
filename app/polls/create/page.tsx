"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { DatabaseService } from "@/lib/database.service"
import { Plus, Trash2, ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { PollOption } from "@/lib/types"

export default function CreatePollPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addOption = () => {
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: ""
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to create a poll")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const validOptions = options
        .filter(option => option.text.trim() !== "")
        .map(option => option.text.trim())

      const pollData = {
        title: title.trim(),
        description: description.trim() || null,
        options: validOptions
      }

      const createdPoll = await DatabaseService.createPoll(pollData, user.id)
      
      // Show success message
      setSuccess(`Poll "${createdPoll.title}" created successfully!`)
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Failed to create poll:', err)
      setError(err instanceof Error ? err.message : 'Failed to create poll. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = title.trim() !== "" && 
    options.filter(option => option.text.trim() !== "").length >= 2

  return (
    <ProtectedRoute>
      <MainLayout>
        <PageWrapper maxWidth="lg">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
          <p className="text-gray-600 mt-2">Create a poll to gather opinions from your audience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Fill in the details for your new poll
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {success}
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
                  disabled={isLoading || !!success}
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
                  disabled={isLoading || !!success}
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
                    disabled={isLoading || !!success}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(option.id, e.target.value)}
                          disabled={isLoading || !!success}
                        />
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          disabled={isLoading || !!success}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6">
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isLoading || !!success}
                >
                  {success ? "Poll Created Successfully!" : isLoading ? "Creating Poll..." : "Create Poll"}
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