-- Insert sample users (these will be created through Supabase Auth in real usage)
-- This is just for reference - actual users are managed by Supabase Auth

-- Insert sample polls
INSERT INTO polls (id, title, description, status, created_by, expires_at, allow_multiple_votes, is_anonymous) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'What is your favorite programming language?',
    'Help us understand the community preferences for programming languages in 2024.',
    'active',
    '550e8400-e29b-41d4-a716-446655440000', -- This should be replaced with actual user ID
    NOW() + INTERVAL '7 days',
    false,
    false
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Best time for team meetings?',
    'When should we schedule our weekly team sync meetings?',
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '3 days',
    false,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Office lunch preferences',
    'What type of food should we order for the office lunch next week? Multiple selections allowed.',
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '5 days',
    true,
    false
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Completed Survey Example',
    'This is an example of a closed poll to show historical data.',
    'closed',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '1 day',
    false,
    false
);

-- Insert poll options for "What is your favorite programming language?"
INSERT INTO poll_options (id, poll_id, text, position) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript/TypeScript', 1),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Python', 2),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Java', 3),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'C#', 4),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Go', 5),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Rust', 6),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Other', 7);

-- Insert poll options for "Best time for team meetings?"
INSERT INTO poll_options (id, poll_id, text, position) VALUES
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', '9:00 AM', 1),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', '10:00 AM', 2),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', '2:00 PM', 3),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '3:00 PM', 4),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '4:00 PM', 5);

-- Insert poll options for "Office lunch preferences"
INSERT INTO poll_options (id, poll_id, text, position) VALUES
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'Pizza', 1),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'Chinese Food', 2),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'Mexican Food', 3),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440003', 'Sandwiches', 4),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', 'Salads', 5),
('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440003', 'Indian Food', 6);

-- Insert poll options for "Completed Survey Example"
INSERT INTO poll_options (id, poll_id, text, position) VALUES
('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440004', 'Option A', 1),
('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440004', 'Option B', 2),
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440004', 'Option C', 3);

-- Insert sample votes (these would normally be created by authenticated users)
-- Programming language poll votes
INSERT INTO votes (poll_id, option_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004');

-- Meeting time poll votes
INSERT INTO votes (poll_id, option_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002');

-- Lunch preferences poll votes (multiple votes allowed)
INSERT INTO votes (poll_id, option_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002');

-- Completed survey votes
INSERT INTO votes (poll_id, option_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440004');

-- Note: In a real application, the user_id values should be actual UUIDs from Supabase Auth
-- These are placeholder values for development/testing purposes