// User and Authentication Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
  refreshToken: string
}

// Poll Types
export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  title: string
  description?: string
  status: PollStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByUser?: User
  totalVotes: number
  options: PollOption[]
  allowMultipleVotes?: boolean
  expiresAt?: string
  isPublic: boolean
  shareUrl?: string
}

export type PollStatus = 'draft' | 'active' | 'closed' | 'expired'

export interface CreatePollData {
  title: string
  description?: string
  options: Omit<PollOption, 'id' | 'votes'>[]
  allowMultipleVotes?: boolean
  expiresAt?: string
  isPublic?: boolean
}

export interface UpdatePollData {
  title?: string
  description?: string
  options?: PollOption[]
  status?: PollStatus
  allowMultipleVotes?: boolean
  expiresAt?: string
  isPublic?: boolean
}

// Vote Types
export interface Vote {
  id: string
  pollId: string
  optionId: string
  userId?: string
  ipAddress?: string
  createdAt: string
}

export interface VoteData {
  pollId: string
  optionId: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard Types
export interface DashboardStats {
  totalPolls: number
  totalVotes: number
  activePolls: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'poll_created' | 'poll_voted' | 'poll_closed'
  message: string
  createdAt: string
  pollId?: string
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormState<T> {
  data: T
  errors: FormErrors
  isSubmitting: boolean
  isValid: boolean
}

// Component Props Types
export interface PollCardProps {
  poll: Poll
  showActions?: boolean
  onEdit?: (poll: Poll) => void
  onDelete?: (poll: Poll) => void
  onView?: (poll: Poll) => void
}

export interface VotingComponentProps {
  poll: Poll
  onVote: (optionId: string) => void
  hasVoted: boolean
  isVoting: boolean
  selectedOption?: string
}

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>