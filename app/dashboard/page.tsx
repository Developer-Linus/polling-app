"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Plus, BarChart3, Users, Eye } from "lucide-react"

// Mock data - replace with real data later
const mockPolls = [
  {
    id: "1",
    title: "Favorite Programming Language",
    description: "What's your preferred programming language for web development?",
    status: "active",
    responses: 42,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Remote Work Preferences",
    description: "How do you prefer to work in the post-pandemic era?",
    status: "closed",
    responses: 128,
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    title: "Coffee vs Tea",
    description: "The eternal debate: coffee or tea?",
    status: "draft",
    responses: 0,
    createdAt: "2024-01-20",
  },
]

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
              <div className="text-2xl font-bold">{mockPolls.length}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockPolls.reduce((sum, poll) => sum + poll.responses, 0)}
              </div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockPolls.filter(poll => poll.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Currently collecting responses</p>
            </CardContent>
          </Card>
        </div>

        {/* Polls List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
          <div className="grid gap-4">
            {mockPolls.map((poll) => (
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
                      <span>{poll.responses} responses</span>
                      <span>Created {poll.createdAt}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/polls/${poll.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/polls/${poll.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </PageWrapper>
      </MainLayout>
    </ProtectedRoute>
  )
}