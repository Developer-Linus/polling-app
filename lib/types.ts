// Re-export database types for consistency
export type {
  Poll,
  PollInsert,
  PollUpdate,
  PollOption,
  PollOptionInsert,
  PollOptionUpdate,
  Vote,
  VoteInsert,
  VoteUpdate,
  PollResult,
  PollWithOptions,
  PollWithResults,
  PollWithUserVote,
  CreatePollRequest,
  UpdatePollRequest,
  VoteRequest,
  PollsResponse,
  PollFilters,
  PollSortBy,
  SortOrder,
  PollSort,
  PaginationParams,
  DatabaseError,
  PollFormData,
  PollOptionFormData,
  PollStats,
  UserPollStats
} from './database.types';

// User types (for Supabase Auth)
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

// Poll status types (used by utility functions)
export type PollStatus = 'active' | 'closed' | 'draft' | 'expired';

/** @deprecated Use CreatePollRequest from database.types.ts */
export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  expires_at?: string;
}

/** @deprecated Use UpdatePollRequest from database.types.ts */
export interface UpdatePollData {
  title?: string;
  description?: string;
  status?: PollStatus;
  expires_at?: string;
}

/** @deprecated Use VoteRequest from database.types.ts */
export interface VoteData {
  option_id: string;
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

export interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}

export interface MainLayoutProps {
  children: React.ReactNode
  showNavbar?: boolean
}

export interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  redirectTo?: string
  children?: React.ReactNode
  onClick?: () => void
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

// Form-specific interfaces
export interface PollOption {
  id: string
  text: string
}

export interface EditablePollOption {
  id: string
  text: string
  vote_count: number
  position: number
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