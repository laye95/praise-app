-- Seed users table
-- Note: Users are automatically created by the trigger when auth users are inserted
-- This file updates the auto-created users with proper roles and church assignments

UPDATE public.users
SET
  role = 'super_admin',
  church_id = NULL
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.users
SET
  role = 'church_admin',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE public.users
SET
  role = 'member',
  church_id = NULL
WHERE id = '00000000-0000-0000-0000-000000000004';
