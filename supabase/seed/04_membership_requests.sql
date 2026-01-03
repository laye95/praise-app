-- Seed membership requests
-- This creates a pending membership request from testmember@praise.test to the first church

INSERT INTO public.church_membership_requests (
  id,
  church_id,
  user_id,
  status,
  message,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'pending',
  'I would like to join this church community.',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

