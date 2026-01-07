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

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000006';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000007';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000008';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000009';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000010';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000011';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000012';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000013';

UPDATE public.users
SET
  role = 'member',
  church_id = '10000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000014';
