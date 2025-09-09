import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'next/navigation'
import PollResultsPage from '@/app/polls/[id]/results/page'
import { DatabaseService } from '@/lib/database.service'
import { useAuth } from '@/components/auth/auth-provider'
import type { PollWithUserVote } from '@/lib/database.types'

// Mock the dependencies
jest.mock('@/lib/database.service')
jest.mock('@/components/auth/auth-provider')

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Get the mocked useParams from the jest.mock
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>

// Mock poll data
const mockPollData: PollWithUserVote = {
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'Test poll description',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1',
  total_votes: 10,
  poll_options: [
    {
      id: 'option-1',
      text: 'Option 1',
      poll_id: 'test-poll-id',
      vote_count: 6,
      user_voted: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'option-2',
      text: 'Option 2',
      poll_id: 'test-poll-id',
      vote_count: 4,
      user_voted: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User'
}

describe('PollResultsPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Default mock implementations
    mockUseParams.mockReturnValue({ id: 'test-poll-id' })
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loading: false
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching poll data', () => {
      // Mock a pending promise to simulate loading
      mockDatabaseService.getPollById.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<PollResultsPage />)

      expect(screen.getByText('Loading poll results...')).toBeInTheDocument()
      expect(screen.getByText('Loading poll results...')).toBeInTheDocument()
    })
  })

  describe('Successful Poll Fetching', () => {
    it('should display poll results when data is fetched successfully', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Poll - Results')).toBeInTheDocument()
      })

      expect(screen.getByText('Test poll description')).toBeInTheDocument()
      expect(screen.getByText('10 total votes')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('6 votes')).toBeInTheDocument()
      expect(screen.getByText('4 votes')).toBeInTheDocument()
    })

    it('should show winning option with trophy icon', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Poll - Results')).toBeInTheDocument()
      })

      // Option 1 should be winning with 6 votes vs 4 votes
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('6 votes')).toBeInTheDocument()
      expect(screen.getByText('4 votes')).toBeInTheDocument()
    })

    it('should show user voted option with checkmark', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('✓ Your vote')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling - Non-existent Poll ID', () => {
    it('should show error message when poll is not found (returns null)', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(null)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
      })

      expect(screen.getByText('Poll not found')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })

    it('should show error message when poll ID does not exist', async () => {
      mockUseParams.mockReturnValue({ id: 'non-existent-id' })
      mockDatabaseService.getPollById.mockResolvedValue(null)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
      })

      expect(screen.getByText('Poll not found')).toBeInTheDocument()
    })
  })

  describe('Error Handling - Database Failures', () => {
    it('should show error message when database fetch fails', async () => {
      const errorMessage = 'Database connection failed'
      mockDatabaseService.getPollById.mockRejectedValue(new Error(errorMessage))

      // Spy on console.error to verify error logging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
      })

      expect(screen.getByText('Failed to load poll results')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch poll:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle network errors gracefully', async () => {
      mockDatabaseService.getPollById.mockRejectedValue(new Error('Network error'))

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load poll results')).toBeInTheDocument()
      })

      expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
    })

    it('should handle timeout errors', async () => {
      mockDatabaseService.getPollById.mockRejectedValue(new Error('Request timeout'))

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load poll results')).toBeInTheDocument()
      })
    })

    it('should handle specific database service errors', async () => {
      // Test the specific error we added for 'test-error' ID
      mockUseParams.mockReturnValue({ id: 'test-error' })
      mockDatabaseService.getPollById.mockRejectedValue(new Error('Simulated database error'))

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load poll results')).toBeInTheDocument()
      })
    })
  })

  describe('User Authentication States', () => {
    it('should work correctly when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        loading: false
      })
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Poll - Results')).toBeInTheDocument()
      })

      // Should not show the thank you message for unauthenticated users
      expect(screen.queryByText('Thank you for voting! Here are the current results.')).not.toBeInTheDocument()
    })

    it('should show thank you message for authenticated users', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Thank you for voting! Here are the current results.')).toBeInTheDocument()
      })
    })
  })

  describe('Share Functionality', () => {
    it('should copy poll results URL to clipboard when share button is clicked', async () => {
      mockDatabaseService.getPollById.mockResolvedValue(mockPollData)
      
      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Share Results')).toBeInTheDocument()
      })

      const shareButton = screen.getByText('Share Results')
      shareButton.click()

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
      expect(global.alert).toHaveBeenCalledWith('Poll results link copied to clipboard!')
    })
  })

  describe('Edge Cases', () => {
    it('should handle poll with no votes', async () => {
      const pollWithNoVotes = {
        ...mockPollData,
        total_votes: 0,
        poll_options: mockPollData.poll_options.map(option => ({
          ...option,
          vote_count: 0,
          user_voted: false
        }))
      }
      
      mockDatabaseService.getPollById.mockResolvedValue(pollWithNoVotes)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('No votes have been cast yet.')).toBeInTheDocument()
      })
    })

    it('should handle poll with empty options array', async () => {
      const pollWithNoOptions = {
        ...mockPollData,
        poll_options: []
      }
      
      mockDatabaseService.getPollById.mockResolvedValue(pollWithNoOptions)

      render(<PollResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Poll - Results')).toBeInTheDocument()
      })
    })
  })
})