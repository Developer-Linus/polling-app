# Supabase Database Schema

This directory contains the database schema and configuration for the Polling App.

## Database Structure

### Tables

#### `polls`
Stores poll information and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `title` | VARCHAR(255) | Poll title |
| `description` | TEXT | Optional poll description |
| `status` | VARCHAR(20) | Poll status: 'active', 'closed', 'draft' |
| `created_by` | UUID | Foreign key to auth.users |
| `created_at` | TIMESTAMPTZ | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated modification timestamp |
| `expires_at` | TIMESTAMPTZ | Optional expiration date |
| `allow_multiple_votes` | BOOLEAN | Whether users can select multiple options |
| `is_anonymous` | BOOLEAN | Whether votes are anonymous |

#### `poll_options`
Stores the available options for each poll.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `poll_id` | UUID | Foreign key to polls table |
| `text` | VARCHAR(500) | Option text |
| `position` | INTEGER | Display order (0-based) |
| `created_at` | TIMESTAMPTZ | Auto-generated creation timestamp |

#### `votes`
Stores individual votes cast by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `poll_id` | UUID | Foreign key to polls table |
| `option_id` | UUID | Foreign key to poll_options table |
| `user_id` | UUID | Foreign key to auth.users (nullable for anonymous) |
| `voter_ip` | INET | IP address for anonymous voting |
| `created_at` | TIMESTAMPTZ | Auto-generated creation timestamp |

### Views

#### `poll_results`
Aggregated view showing poll results with vote counts.

| Column | Type | Description |
|--------|------|-------------|
| `poll_id` | UUID | Poll identifier |
| `title` | VARCHAR(255) | Poll title |
| `description` | TEXT | Poll description |
| `status` | VARCHAR(20) | Poll status |
| `created_at` | TIMESTAMPTZ | Poll creation date |
| `expires_at` | TIMESTAMPTZ | Poll expiration date |
| `option_id` | UUID | Option identifier |
| `option_text` | VARCHAR(500) | Option text |
| `position` | INTEGER | Option position |
| `vote_count` | BIGINT | Number of votes for this option |
| `total_votes` | BIGINT | Total votes for the poll |

## Security

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

**Polls:**
- Users can view active and closed polls
- Users can create, update, and delete their own polls

**Poll Options:**
- Users can view options for visible polls
- Poll creators can manage their poll options

**Votes:**
- Users can view vote counts for visible polls
- Authenticated users can vote on active polls
- Users can delete their own votes

### Authentication
- Uses Supabase Auth for user management
- JWT tokens for API authentication
- Session management handled by Supabase

## Setup Instructions

### Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker (for local development)

### Local Development

1. **Initialize Supabase locally:**
   ```bash
   supabase init
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   ```

3. **Apply migrations:**
   ```bash
   supabase db reset
   ```

4. **Access local services:**
   - API: http://localhost:54321
   - Studio: http://localhost:54323
   - Inbucket (emails): http://localhost:54324

### Production Deployment

1. **Link to your Supabase project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Push migrations:**
   ```bash
   supabase db push
   ```

3. **Verify deployment:**
   ```bash
   supabase db diff
   ```

## Environment Variables

Update your `.env.local` file with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Sample Data

The `seed.sql` file contains sample data for development and testing:
- 4 example polls with different configurations
- Multiple poll options for each poll
- Sample votes to demonstrate the voting system

**Note:** The seed data uses placeholder user IDs. In production, these should be actual Supabase Auth user IDs.

## Database Functions

### Triggers
- `update_updated_at_column()`: Automatically updates the `updated_at` timestamp on polls

### Indexes
Optimized indexes for:
- Poll queries by creator, status, and creation date
- Vote aggregation by poll and option
- User-specific queries

## Best Practices

1. **Migrations:** Always create new migration files for schema changes
2. **Testing:** Test migrations on local environment before production
3. **Backup:** Regular database backups in production
4. **Monitoring:** Monitor query performance and optimize as needed
5. **Security:** Regularly review and update RLS policies

## Troubleshooting

### Common Issues

1. **Migration fails:**
   ```bash
   supabase db reset --debug
   ```

2. **RLS policy errors:**
   - Check user authentication status
   - Verify policy conditions
   - Review table permissions

3. **Performance issues:**
   - Check query execution plans
   - Verify indexes are being used
   - Consider query optimization

### Useful Commands

```bash
# View migration status
supabase migration list

# Create new migration
supabase migration new migration_name

# Generate types for TypeScript
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs
```