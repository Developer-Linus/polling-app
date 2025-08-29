import { supabase } from './supabase';
import type { Database } from './database.types';
import type {
  Poll,
  PollWithOptions,
  PollWithResults,
  PollWithUserVote,
  CreatePollRequest,
  UpdatePollRequest,
  VoteRequest,
  PollsResponse,
  PollFilters,
  PollSort,
  PaginationParams,
  PollStats,
  UserPollStats
} from './database.types';

/**
 * Database service for poll operations
 */
export class DatabaseService {
  /**
   * Get all polls with optional filtering, sorting, and pagination
   */
  static async getPolls(
    filters?: PollFilters,
    sort?: PollSort,
    pagination?: PaginationParams
  ): Promise<PollsResponse> {
    // If filtering by created_by, we need to query polls table first
    if (filters?.created_by) {
      return this.getPollsByCreator(filters.created_by, filters, sort, pagination);
    }

    let query = supabase
      .from('poll_results')
      .select('*');

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.expires_after) {
      query = query.gte('expires_at', filters.expires_after);
    }
    if (filters?.expires_before) {
      query = query.lte('expires_at', filters.expires_before);
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.by, { ascending: sort.order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch polls: ${error.message}`);
    }

    // Group results by poll
    const pollsMap = new Map<string, PollWithResults>();
    
    data?.forEach((row) => {
      if (!row.poll_id) return;
      
      if (!pollsMap.has(row.poll_id)) {
        pollsMap.set(row.poll_id, {
          id: row.poll_id,
          title: row.title || '',
          description: row.description,
          status: row.status || 'draft',
          created_by: '', // Will be filled from polls table
          created_at: row.created_at || '',
          updated_at: '', // Will be filled from polls table
          expires_at: row.expires_at,
          allow_multiple_votes: false, // Will be filled from polls table
          is_anonymous: false, // Will be filled from polls table
          poll_options: [],
          total_votes: row.total_votes || 0
        });
      }
      
      const poll = pollsMap.get(row.poll_id)!;
      if (row.option_id) {
        poll.poll_options.push({
          id: row.option_id,
          poll_id: row.poll_id,
          text: row.option_text || '',
          position: row.position || 0,
          created_at: '',
          vote_count: row.vote_count || 0
        });
      }
    });

    return {
      polls: Array.from(pollsMap.values()),
      total: count || 0,
      page,
      limit
    };
  }

  /**
   * Get a single poll by ID with options and vote counts
   */
  static async getPollById(id: string, userId?: string): Promise<PollWithUserVote | null> {
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !pollData) {
      return null;
    }

    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', id)
      .order('position');

    if (optionsError) {
      throw new Error(`Failed to fetch poll options: ${optionsError.message}`);
    }

    // Get vote counts for each option
    const { data: voteCounts, error: voteError } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', id);

    if (voteError) {
      throw new Error(`Failed to fetch vote counts: ${voteError.message}`);
    }

    // Get user's votes if userId provided
    let userVotes: string[] = [];
    if (userId) {
      const { data: userVoteData } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', id)
        .eq('user_id', userId);
      
      userVotes = userVoteData?.map(v => v.option_id) || [];
    }

    // Count votes per option
    const voteCountMap = new Map<string, number>();
    voteCounts?.forEach(vote => {
      const count = voteCountMap.get(vote.option_id) || 0;
      voteCountMap.set(vote.option_id, count + 1);
    });

    const poll_options = optionsData?.map(option => ({
      ...option,
      vote_count: voteCountMap.get(option.id) || 0,
      user_voted: userVotes.includes(option.id)
    })) || [];

    const total_votes = voteCounts?.length || 0;
    const user_can_vote = userId ? (
      pollData.status === 'active' &&
      (!pollData.expires_at || new Date(pollData.expires_at) > new Date()) &&
      (pollData.allow_multiple_votes || userVotes.length === 0)
    ) : false;

    return {
      ...pollData,
      poll_options,
      total_votes,
      user_can_vote
    };
  }

  /**
   * Create a new poll
   */
  static async createPoll(pollData: CreatePollRequest, userId: string): Promise<Poll> {
    const { options, ...pollFields } = pollData;

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        ...pollFields,
        created_by: userId
      })
      .select()
      .single();

    if (pollError || !poll) {
      throw new Error(`Failed to create poll: ${pollError?.message}`);
    }

    // Create poll options
    const optionsToInsert = options.map((text, index) => ({
      poll_id: poll.id,
      text,
      position: index
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      // Rollback: delete the poll if options creation failed
      await supabase.from('polls').delete().eq('id', poll.id);
      throw new Error(`Failed to create poll options: ${optionsError.message}`);
    }

    return poll;
  }

  /**
   * Update an existing poll
   */
  static async updatePoll(id: string, updates: UpdatePollRequest, userId: string): Promise<Poll> {
    const { data: poll, error } = await supabase
      .from('polls')
      .update(updates)
      .eq('id', id)
      .eq('created_by', userId) // Ensure user owns the poll
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update poll: ${error.message}`);
    }

    if (!poll) {
      throw new Error('Poll not found or you do not have permission to update it');
    }

    return poll;
  }

  /**
   * Delete a poll
   */
  static async deletePoll(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id)
      .eq('created_by', userId); // Ensure user owns the poll

    if (error) {
      throw new Error(`Failed to delete poll: ${error.message}`);
    }
  }

  /**
   * Cast a vote
   */
  static async vote(pollId: string, voteData: VoteRequest, userId: string): Promise<void> {
    // Check if poll allows multiple votes
    const { data: poll } = await supabase
      .from('polls')
      .select('allow_multiple_votes, status, expires_at')
      .eq('id', pollId)
      .single();

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new Error('Poll is not active');
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error('Poll has expired');
    }

    // If not allowing multiple votes, remove existing votes
    if (!poll.allow_multiple_votes) {
      await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', userId);
    }

    // Insert new votes
    const votesToInsert = voteData.option_ids.map(optionId => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    }));

    const { error } = await supabase
      .from('votes')
      .insert(votesToInsert);

    if (error) {
      throw new Error(`Failed to cast vote: ${error.message}`);
    }
  }

  /**
   * Remove a user's vote
   */
  static async removeVote(pollId: string, userId: string, optionId?: string): Promise<void> {
    let query = supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (optionId) {
      query = query.eq('option_id', optionId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to remove vote: ${error.message}`);
    }
  }

  /**
   * Get polls created by a specific user
   */
  private static async getPollsByCreator(
    userId: string,
    filters?: PollFilters,
    sort?: PollSort,
    pagination?: PaginationParams
  ): Promise<PollsResponse> {
    // First get polls created by the user
    let pollQuery = supabase
      .from('polls')
      .select('*')
      .eq('created_by', userId);

    // Apply additional filters
    if (filters?.status) {
      pollQuery = pollQuery.eq('status', filters.status);
    }
    if (filters?.search) {
      pollQuery = pollQuery.ilike('title', `%${filters.search}%`);
    }
    if (filters?.expires_after) {
      pollQuery = pollQuery.gte('expires_at', filters.expires_after);
    }
    if (filters?.expires_before) {
      pollQuery = pollQuery.lte('expires_at', filters.expires_before);
    }

    // Apply sorting
    if (sort) {
      pollQuery = pollQuery.order(sort.by, { ascending: sort.order === 'asc' });
    } else {
      pollQuery = pollQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: polls, error: pollsError, count } = await pollQuery.range(from, to);

    if (pollsError) {
      throw new Error(`Failed to fetch user polls: ${pollsError.message}`);
    }

    if (!polls || polls.length === 0) {
      return {
        polls: [],
        total: 0,
        page,
        limit
      };
    }

    // Get poll options and vote counts for each poll
    const pollIds = polls.map(poll => poll.id);
    
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .in('poll_id', pollIds)
      .order('position');

    if (optionsError) {
      throw new Error(`Failed to fetch poll options: ${optionsError.message}`);
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('option_id, poll_id')
      .in('poll_id', pollIds);

    if (votesError) {
      throw new Error(`Failed to fetch votes: ${votesError.message}`);
    }

    // Group options by poll_id
    const optionsByPoll = new Map<string, any[]>();
    options?.forEach(option => {
      if (!optionsByPoll.has(option.poll_id)) {
        optionsByPoll.set(option.poll_id, []);
      }
      optionsByPoll.get(option.poll_id)!.push(option);
    });

    // Count votes by option
    const voteCountsByOption = new Map<string, number>();
    const voteCountsByPoll = new Map<string, number>();
    votes?.forEach(vote => {
      // Count by option
      const optionCount = voteCountsByOption.get(vote.option_id) || 0;
      voteCountsByOption.set(vote.option_id, optionCount + 1);
      
      // Count by poll
      const pollCount = voteCountsByPoll.get(vote.poll_id) || 0;
      voteCountsByPoll.set(vote.poll_id, pollCount + 1);
    });

    // Build the result
    const pollsWithResults: PollWithResults[] = polls.map(poll => {
      const pollOptions = optionsByPoll.get(poll.id) || [];
      const poll_options = pollOptions.map(option => ({
        ...option,
        vote_count: voteCountsByOption.get(option.id) || 0
      }));

      return {
        ...poll,
        poll_options,
        total_votes: voteCountsByPoll.get(poll.id) || 0
      };
    });

    return {
      polls: pollsWithResults,
      total: count || 0,
      page,
      limit
    };
  }

  /**
   * Get polls created by a user
   */
  static async getUserPolls(userId: string, pagination?: PaginationParams): Promise<PollsResponse> {
    return this.getPolls({ created_by: userId }, undefined, pagination);
  }

  /**
   * Get poll statistics
   */
  static async getPollStats(): Promise<PollStats> {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('status');

    if (pollsError) {
      throw new Error(`Failed to fetch poll stats: ${pollsError.message}`);
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id');

    if (votesError) {
      throw new Error(`Failed to fetch vote stats: ${votesError.message}`);
    }

    const total_polls = polls?.length || 0;
    const active_polls = polls?.filter(p => p.status === 'active').length || 0;
    const closed_polls = polls?.filter(p => p.status === 'closed').length || 0;
    const draft_polls = polls?.filter(p => p.status === 'draft').length || 0;
    const total_votes = votes?.length || 0;
    const average_votes_per_poll = total_polls > 0 ? total_votes / total_polls : 0;

    return {
      total_polls,
      active_polls,
      closed_polls,
      draft_polls,
      total_votes,
      average_votes_per_poll
    };
  }

  /**
   * Get user-specific poll statistics
   */
  static async getUserPollStats(userId: string): Promise<UserPollStats> {
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id')
      .eq('created_by', userId);

    if (pollsError) {
      throw new Error(`Failed to fetch user polls: ${pollsError.message}`);
    }

    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId);

    if (votesError) {
      throw new Error(`Failed to fetch user votes: ${votesError.message}`);
    }

    // Get most popular poll
    const { data: popularPoll } = await supabase
      .from('poll_results')
      .select('poll_id, title, total_votes')
      .eq('created_by', userId)
      .order('total_votes', { ascending: false })
      .limit(1)
      .single();

    return {
      polls_created: userPolls?.length || 0,
      votes_cast: userVotes?.length || 0,
      most_popular_poll: popularPoll ? {
        id: popularPoll.poll_id || '',
        title: popularPoll.title || '',
        vote_count: popularPoll.total_votes || 0
      } : null
    };
  }
}