import { Poll, User, DashboardStats, ActivityItem } from './types'

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z'
  }
]

// Mock Polls
export const mockPolls: Poll[] = [
  {
    id: '1',
    title: 'Favorite Programming Language',
    description: 'What\'s your preferred programming language for web development?',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: '1',
    createdByUser: mockUsers[0],
    totalVotes: 42,
    isPublic: true,
    shareUrl: 'https://polling-app.com/polls/1',
    options: [
      { id: 'opt1', text: 'JavaScript', votes: 18 },
      { id: 'opt2', text: 'Python', votes: 12 },
      { id: 'opt3', text: 'TypeScript', votes: 8 },
      { id: 'opt4', text: 'Go', votes: 4 }
    ]
  },
  {
    id: '2',
    title: 'Remote Work Preferences',
    description: 'How do you prefer to work in the post-pandemic era?',
    status: 'closed',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: '1',
    createdByUser: mockUsers[0],
    totalVotes: 128,
    isPublic: true,
    shareUrl: 'https://polling-app.com/polls/2',
    options: [
      { id: 'opt5', text: 'Fully Remote', votes: 65 },
      { id: 'opt6', text: 'Hybrid (2-3 days office)', votes: 38 },
      { id: 'opt7', text: 'Mostly Office', votes: 15 },
      { id: 'opt8', text: 'Fully Office', votes: 10 }
    ]
  },
  {
    id: '3',
    title: 'Coffee vs Tea',
    description: 'The eternal debate: coffee or tea?',
    status: 'draft',
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    createdBy: '2',
    createdByUser: mockUsers[1],
    totalVotes: 0,
    isPublic: false,
    options: [
      { id: 'opt9', text: 'Coffee', votes: 0 },
      { id: 'opt10', text: 'Tea', votes: 0 },
      { id: 'opt11', text: 'Both', votes: 0 },
      { id: 'opt12', text: 'Neither', votes: 0 }
    ]
  },
  {
    id: '4',
    title: 'Best Frontend Framework 2024',
    description: 'Which frontend framework do you think will dominate in 2024?',
    status: 'active',
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    createdBy: '3',
    createdByUser: mockUsers[2],
    totalVotes: 89,
    isPublic: true,
    shareUrl: 'https://polling-app.com/polls/4',
    expiresAt: '2024-02-18T16:45:00Z',
    options: [
      { id: 'opt13', text: 'React', votes: 35 },
      { id: 'opt14', text: 'Vue.js', votes: 22 },
      { id: 'opt15', text: 'Angular', votes: 18 },
      { id: 'opt16', text: 'Svelte', votes: 14 }
    ]
  },
  {
    id: '5',
    title: 'Preferred Code Editor',
    description: 'What code editor do you use for daily development?',
    status: 'active',
    createdAt: '2024-01-22T11:20:00Z',
    updatedAt: '2024-01-22T11:20:00Z',
    createdBy: '1',
    createdByUser: mockUsers[0],
    totalVotes: 156,
    isPublic: true,
    shareUrl: 'https://polling-app.com/polls/5',
    options: [
      { id: 'opt17', text: 'VS Code', votes: 98 },
      { id: 'opt18', text: 'WebStorm', votes: 28 },
      { id: 'opt19', text: 'Vim/Neovim', votes: 18 },
      { id: 'opt20', text: 'Sublime Text', votes: 12 }
    ]
  }
]

// Mock Activity Items
export const mockActivityItems: ActivityItem[] = [
  {
    id: '1',
    type: 'poll_created',
    message: 'Created poll "Preferred Code Editor"',
    createdAt: '2024-01-22T11:20:00Z',
    pollId: '5'
  },
  {
    id: '2',
    type: 'poll_voted',
    message: 'Received 5 new votes on "Best Frontend Framework 2024"',
    createdAt: '2024-01-21T15:30:00Z',
    pollId: '4'
  },
  {
    id: '3',
    type: 'poll_closed',
    message: 'Closed poll "Remote Work Preferences"',
    createdAt: '2024-01-20T14:30:00Z',
    pollId: '2'
  },
  {
    id: '4',
    type: 'poll_voted',
    message: 'Received 3 new votes on "Favorite Programming Language"',
    createdAt: '2024-01-19T09:45:00Z',
    pollId: '1'
  },
  {
    id: '5',
    type: 'poll_created',
    message: 'Created poll "Best Frontend Framework 2024"',
    createdAt: '2024-01-18T16:45:00Z',
    pollId: '4'
  }
]

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalPolls: mockPolls.length,
  totalVotes: mockPolls.reduce((sum, poll) => sum + poll.totalVotes, 0),
  activePolls: mockPolls.filter(poll => poll.status === 'active').length,
  recentActivity: mockActivityItems
}

// Helper functions to get mock data
export const getMockPollById = (id: string): Poll | undefined => {
  return mockPolls.find(poll => poll.id === id)
}

export const getMockPollsByUser = (userId: string): Poll[] => {
  return mockPolls.filter(poll => poll.createdBy === userId)
}

export const getMockUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id)
}

export const getMockActivePollsCount = (): number => {
  return mockPolls.filter(poll => poll.status === 'active').length
}

export const getMockTotalVotesCount = (): number => {
  return mockPolls.reduce((sum, poll) => sum + poll.totalVotes, 0)
}

// Mock API delay function
export const mockApiDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate mock poll data
export const generateMockPoll = (overrides: Partial<Poll> = {}): Poll => {
  const defaultPoll: Poll = {
    id: Date.now().toString(),
    title: 'Sample Poll',
    description: 'This is a sample poll for testing',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '1',
    totalVotes: 0,
    isPublic: true,
    options: [
      { id: 'opt1', text: 'Option 1', votes: 0 },
      { id: 'opt2', text: 'Option 2', votes: 0 }
    ]
  }

  return { ...defaultPoll, ...overrides }
}