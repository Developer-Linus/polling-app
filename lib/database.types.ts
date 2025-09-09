export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'active' | 'closed' | 'draft'
          created_by: string
          created_at: string
          updated_at: string
          expires_at: string | null
          allow_multiple_votes: boolean
          is_anonymous: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'active' | 'closed' | 'draft'
          created_by: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          allow_multiple_votes?: boolean
          is_anonymous?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'active' | 'closed' | 'draft'
          created_by?: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          allow_multiple_votes?: boolean
          is_anonymous?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_results"
            referencedColumns: ["poll_id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          user_id: string | null
          voter_ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          user_id?: string | null
          voter_ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_id?: string
          user_id?: string | null
          voter_ip?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_results"
            referencedColumns: ["poll_id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      poll_results: {
        Row: {
          poll_id: string | null
          title: string | null
          description: string | null
          status: 'active' | 'closed' | 'draft' | null
          created_at: string | null
          expires_at: string | null
          option_id: string | null
          option_text: string | null
          position: number | null
          vote_count: number | null
          total_votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Poll = Database['public']['Tables']['polls']['Row']
export type PollInsert = Database['public']['Tables']['polls']['Insert']
export type PollUpdate = Database['public']['Tables']['polls']['Update']

export type PollOption = Database['public']['Tables']['poll_options']['Row']
export type PollOptionInsert = Database['public']['Tables']['poll_options']['Insert']
export type PollOptionUpdate = Database['public']['Tables']['poll_options']['Update']

export type Vote = Database['public']['Tables']['votes']['Row']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']
export type VoteUpdate = Database['public']['Tables']['votes']['Update']

export type PollResult = Database['public']['Views']['poll_results']['Row']

// Extended types for application use
export interface PollWithOptions extends Poll {
  poll_options: PollOption[]
}

export interface PollWithResults extends Poll {
  poll_options: (PollOption & {
    vote_count: number
  })[]
  total_votes: number
}

export interface PollWithUserVote extends Poll {
  poll_options: (PollOption & {
    vote_count: number
    user_voted: boolean
  })[]
  total_votes: number
  user_can_vote: boolean
}

// API response types
export interface CreatePollRequest {
  title: string
  description?: string
  options: string[]
  expires_at?: string
  allow_multiple_votes?: boolean
  is_anonymous?: boolean
}

export interface UpdatePollRequest {
  title?: string
  description?: string
  status?: Poll['status']
  expires_at?: string
  allow_multiple_votes?: boolean
  is_anonymous?: boolean
}

export interface VoteRequest {
  option_ids: string[]
}

export interface PollsResponse {
  polls: PollWithResults[]
  total: number
  page: number
  limit: number
}

// Filter and sort types
export interface PollFilters {
  status?: Poll['status']
  created_by?: string
  search?: string
  expires_after?: string
  expires_before?: string
}

export type PollSortBy = 'created_at' | 'updated_at' | 'title' | 'total_votes'
export type SortOrder = 'asc' | 'desc'

export interface PollSort {
  by: PollSortBy
  order: SortOrder
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
}

// Error types
export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

// Utility types for form handling
export type PollFormData = Omit<PollInsert, 'id' | 'created_by' | 'created_at' | 'updated_at'> & {
  options: string[]
}

export type PollOptionFormData = Omit<PollOptionInsert, 'id' | 'poll_id' | 'created_at'>

// Statistics types
export interface PollStats {
  total_polls: number
  active_polls: number
  closed_polls: number
  draft_polls: number
  total_votes: number
  average_votes_per_poll: number
}

export interface UserPollStats {
  polls_created: number
  votes_cast: number
  most_popular_poll: {
    id: string
    title: string
    vote_count: number
  } | null
}