import { supabase } from './supabase';
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
 * Provides services for all database operations related to polls.
 * This class encapsulates the logic for interacting with the Supabase database.
 */
export class DatabaseService {
  /**
   * Fetches a paginated list of polls, with optional filtering and sorting.
   * Note: Polls are reconstructed from the `poll_results` view for efficiency.
   * @param filters - Optional filters for status, search query, and expiration dates.
   * @param sort - Optional sorting parameters.
   * @param pagination - Optional pagination parameters.
   * @returns A promise that resolves to a paginated response of polls.
   */
  static async getPolls(
    filters?: PollFilters,
    sort?: PollSort,
    pagination?: PaginationParams
  ): Promise<PollsResponse> {
    // If filtering by a specific creator, use the dedicated function which queries the `polls` table directly.
    if (filters?.created_by) {
      return this.getPollsByCreator(filters.created_by, filters, sort, pagination);
    }

    // 1. Build the base query from the `poll_results` view.
    let query = supabase
      .from('poll_results')
      .select('*');

    // 2. Apply filters to the query.
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

    // 3. Apply sorting. Defaults to newest first.
    if (sort) {
      query = query.order(sort.by, { ascending: sort.order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 4. Apply pagination.
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch polls: ${error.message}`);
    }

    // 5. Reconstruct poll objects from the flattened `poll_results` data.
    // The view returns a row for each option, so we need to group them by poll ID.
    const pollsMap = new Map<string, PollWithResults>();
    
    data?.forEach((row) => {
      if (!row.poll_id) return;
      
      // If we haven't seen this poll yet, create its main structure.
      if (!pollsMap.has(row.poll_id)) {
        pollsMap.set(row.poll_id, {
          id: row.poll_id,
          title: row.title || '',
          description: row.description,
          status: row.status || 'draft',
          created_by: '', // Note: `poll_results` view lacks some original poll table fields.
          created_at: row.created_at || '',
          updated_at: '',
          expires_at: row.expires_at,
          allow_multiple_votes: false,
          is_anonymous: false,
          poll_options: [],
          total_votes: row.total_votes || 0
        });
      }
      
      // Add the option from the current row to the poll.
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
   * Retrieves a single poll by its ID, including its options, vote counts, and user-specific vote data.
   * @param id - The ID of the poll to fetch.
   * @param userId - Optional ID of the current user to determine if they have voted.
   * @returns A promise that resolves to the poll data or null if not found.
   */
  static async getPollById(id: string, userId?: string): Promise<PollWithUserVote | null> {
    // 1. Fetch the core poll data.
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !pollData) {
      return null;
    }

    // 2. Fetch the poll's options.
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', id)
      .order('position');

    if (optionsError) {
      throw new Error(`Failed to fetch poll options: ${optionsError.message}`);
    }

    // 3. Get all votes for the poll to calculate total counts for each option.
    const { data: voteCounts, error: voteError } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', id);

    if (voteError) {
      throw new Error(`Failed to fetch vote counts: ${voteError.message}`);
    }

    // 4. If a user is specified, fetch their specific votes for this poll.
    let userVotes: string[] = [];
    if (userId) {
      const { data: userVoteData } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', id)
        .eq('user_id', userId);
      
      userVotes = userVoteData?.map(v => v.option_id) || [];
    }

    // 5. Process and aggregate vote data into a count map.
    const voteCountMap = new Map<string, number>();
    voteCounts?.forEach(vote => {
      const count = voteCountMap.get(vote.option_id) || 0;
      voteCountMap.set(vote.option_id, count + 1);
    });

    // 6. Combine all data into a single, rich poll object.
    const poll_options = optionsData?.map(option => ({
      ...option,
      vote_count: voteCountMap.get(option.id) || 0,
      user_voted: userVotes.includes(option.id)
    })) || [];

    const total_votes = voteCounts?.length || 0;
    
    // Determine if the user is able to vote based on poll status and their past actions.
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
   * Creates a new poll and its associated options.
   * @param pollData - The data for the new poll, including option text.
   * @param userId - The ID of the user creating the poll.
   * @returns A promise that resolves to the newly created poll.
   */
  static async createPoll(pollData: CreatePollRequest, userId: string): Promise<Poll> {
    const { options, ...pollFields } = pollData;

    // 1. Create the poll record in the database.
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

    // 2. Create the associated poll options.
    const optionsToInsert = options.map((text, index) => ({
      poll_id: poll.id,
      text,
      position: index
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      // If creating options fails, roll back poll creation to maintain data integrity.
      await supabase.from('polls').delete().eq('id', poll.id);
      throw new Error(`Failed to create poll options: ${optionsError.message}`);
    }

    return poll;
  }

  /**
   * Updates an existing poll's information and options.
   * @param id - The ID of the poll to update.
   * @param updates - The poll data to update. Can include new options.
   * @param userId - The ID of the user performing the update, for ownership verification.
   * @returns A promise that resolves to the updated poll.
   */
  static async updatePoll(id: string, updates: UpdatePollRequest & { options?: { id: string; text: string; position: number }[] }, userId: string): Promise<Poll> {
    const { options, ...pollUpdates } = updates;
    
    // 1. Update the core poll information, ensuring the user owns the poll.
    const { data: poll, error } = await supabase
      .from('polls')
      .update(pollUpdates)
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update poll: ${error.message}`);
    }
    if (!poll) {
      throw new Error('Poll not found or you do not have permission to update it');
    }

    // 2. If options are provided, update them.
    // Note: This implementation deletes all existing options and re-inserts them.
    if (options) {
      await supabase
        .from('poll_options')
        .delete()
        .eq('poll_id', id);

      const optionsToInsert = options.map(option => {
        const baseOption = {
          poll_id: id,
          text: option.text,
          position: option.position
        };
        // Preserve IDs of existing options, but not for new ones which may have temporary client-side IDs.
        if (!option.id.startsWith('opt')) {
          return { ...baseOption, id: option.id };
        }
        return baseOption;
      });

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) {
        throw new Error(`Failed to update poll options: ${optionsError.message}`);
      }
    }

    return poll;
  }

  /**
   * Updates the status of a poll (e.g., to 'active' or 'closed').
   * @param id - The ID of the poll to update.
   * @param isActive - Whether the poll should be set to 'active'.
   * @param userId - Optional user ID to verify ownership.
   */
  static async updatePollStatus(id: string, isActive: boolean, userId?: string): Promise<void> {
    const status = isActive ? 'active' : 'closed';
    
    const { error } = await supabase
      .from('polls')
      .update({ status })
      .eq('id', id)
      .eq('created_by', userId || '');

    if (error) {
      throw new Error(`Failed to update poll status: ${error.message}`);
    }
  }

  /**
   * Deletes a poll, verifying ownership.
   * @param id - The ID of the poll to delete.
   * @param userId - The ID of the user performing the deletion.
   */
  static async deletePoll(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      throw new Error(`Failed to delete poll: ${error.message}`);
    }
  }

  /**
   * Casts one or more votes in a poll for a user.
   * @param pollId - The ID of the poll to vote in.
   * @param voteData - The vote data, containing the option ID(s).
   * @param userId - The ID of the user casting the vote.
   */
  static async vote(pollId: string, voteData: VoteRequest, userId: string): Promise<void> {
    // 1. Verify the poll exists and is currently active and not expired.
    const { data: poll } = await supabase
      .from('polls')
      .select('allow_multiple_votes, status, expires_at')
      .eq('id', pollId)
      .single();

    if (!poll) throw new Error('Poll not found');
    if (poll.status !== 'active') throw new Error('Poll is not active');
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error('Poll has expired');
    }

    // 2. If the poll doesn't allow multiple choices, clear any previous votes from this user.
    if (!poll.allow_multiple_votes) {
      await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', userId);
    }

    // 3. Insert the new vote(s).
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
   * Removes a user's vote(s) from a poll.
   * @param pollId - The ID of the poll.
   * @param userId - The ID of the user whose vote should be removed.
   * @param optionId - Optional. If provided, only the vote for this option is removed.
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
   * Fetches polls created by a specific user.
   * This method is used internally by `getPolls` when a `created_by` filter is applied.
   * It queries the `polls` table directly and then fetches related options and votes.
   */
  private static async getPollsByCreator(
    userId: string,
    filters?: PollFilters,
    sort?: PollSort,
    pagination?: PaginationParams
  ): Promise<PollsResponse> {
    // 1. Fetch polls created by the user, with filtering, sorting, and pagination.
    let pollQuery = supabase
      .from('polls')
      .select('*')
      .eq('created_by', userId);

    if (filters?.status) pollQuery = pollQuery.eq('status', filters.status);
    if (filters?.search) pollQuery = pollQuery.ilike('title', `%${filters.search}%`);
    if (filters?.expires_after) pollQuery = pollQuery.gte('expires_at', filters.expires_after);
    if (filters?.expires_before) pollQuery = pollQuery.lte('expires_at', filters.expires_before);

    if (sort) {
      pollQuery = pollQuery.order(sort.by, { ascending: sort.order === 'asc' });
    } else {
      pollQuery = pollQuery.order('created_at', { ascending: false });
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: polls, error: pollsError, count } = await pollQuery.range(from, to);

    if (pollsError) throw new Error(`Failed to fetch user polls: ${pollsError.message}`);
    if (!polls || polls.length === 0) {
      return { polls: [], total: 0, page, limit };
    }

    // 2. Fetch options and votes for all retrieved polls in batch to avoid N+1 queries.
    const pollIds = polls.map(poll => poll.id);
    
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .in('poll_id', pollIds)
      .order('position');

    if (optionsError) throw new Error(`Failed to fetch poll options: ${optionsError.message}`);

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('option_id, poll_id')
      .in('poll_id', pollIds);

    if (votesError) throw new Error(`Failed to fetch votes: ${votesError.message}`);

    // 3. Group options and votes by poll for efficient lookup.
    const optionsByPoll = new Map<string, any[]>();
    options?.forEach(option => {
      if (!optionsByPoll.has(option.poll_id)) {
        optionsByPoll.set(option.poll_id, []);
      }
      optionsByPoll.get(option.poll_id)!.push(option);
    });

    const voteCountsByOption = new Map<string, number>();
    const voteCountsByPoll = new Map<string, number>();
    votes?.forEach(vote => {
      voteCountsByOption.set(vote.option_id, (voteCountsByOption.get(vote.option_id) || 0) + 1);
      voteCountsByPoll.set(vote.poll_id, (voteCountsByPoll.get(vote.poll_id) || 0) + 1);
    });

    // 4. Assemble the final poll objects with their options and vote counts.
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
   * A convenience method to get polls created by a specific user.
   * @param userId - The ID of the user.
   * @param pagination - Optional pagination parameters.
   */
  static async getUserPolls(userId: string, pagination?: PaginationParams): Promise<PollsResponse> {
    return this.getPolls({ created_by: userId }, undefined, pagination);
  }

  /**
   * Retrieves high-level statistics about all polls in the system.
   */
  static async getPollStats(): Promise<PollStats> {
    // Note: These queries fetch all records to count them. For very large tables,
    // this could be optimized by using count aggregates.
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('status');

    if (pollsError) throw new Error(`Failed to fetch poll stats: ${pollsError.message}`);

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id');

    if (votesError) throw new Error(`Failed to fetch vote stats: ${votesError.message}`);

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
   * Retrieves statistics about a specific user's polling activity.
   * @param userId - The ID of the user.
   */
  static async getUserPollStats(userId: string): Promise<UserPollStats> {
    const { data: userPolls, error: pollsError } = await supabase
      .from('polls')
      .select('id')
      .eq('created_by', userId);

    if (pollsError) throw new Error(`Failed to fetch user polls: ${pollsError.message}`);

    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId);

    if (votesError) throw new Error(`Failed to fetch user votes: ${votesError.message}`);

    // Find the user's most popular poll by total votes.
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
