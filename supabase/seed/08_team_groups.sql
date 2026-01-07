-- Seed team groups
-- This creates groups within teams and assigns members to groups

DO $$
DECLARE
  worship_team_id UUID := '20000000-0000-0000-0000-000000000001';
  prayer_team_id UUID := '20000000-0000-0000-0000-000000000002';
  hospitality_team_id UUID := '20000000-0000-0000-0000-000000000003';
  kids_team_id UUID := '20000000-0000-0000-0000-000000000004';
  youth_team_id UUID := '20000000-0000-0000-0000-000000000005';
  
  worship_group1_id UUID;
  worship_group2_id UUID;
  prayer_group1_id UUID;
BEGIN
  RAISE NOTICE 'Creating team groups...';

  -- Create groups for Worship Team
  INSERT INTO public.team_groups (id, team_id, name, created_at, updated_at)
  VALUES (
    '30000000-0000-0000-0000-000000000001',
    worship_team_id,
    'Group 1',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

  SELECT id INTO worship_group1_id FROM public.team_groups WHERE id = '30000000-0000-0000-0000-000000000001';
  RAISE NOTICE 'Group 1 ID: %', worship_group1_id;

  INSERT INTO public.team_groups (id, team_id, name, created_at, updated_at)
  VALUES (
    '30000000-0000-0000-0000-000000000002',
    worship_team_id,
    'Group 2',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

  SELECT id INTO worship_group2_id FROM public.team_groups WHERE id = '30000000-0000-0000-0000-000000000002';
  RAISE NOTICE 'Group 2 ID: %', worship_group2_id;

  -- Create group for Prayer Team
  INSERT INTO public.team_groups (id, team_id, name, created_at, updated_at)
  VALUES (
    '30000000-0000-0000-0000-000000000003',
    prayer_team_id,
    'Group 1',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

  SELECT id INTO prayer_group1_id FROM public.team_groups WHERE id = '30000000-0000-0000-0000-000000000003';
  RAISE NOTICE 'Prayer Team Group 1 ID: %', prayer_group1_id;

  -- Assign members to Group 1 (Worship Team)
  -- Sarah as leader - Singer
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000001',
    worship_group1_id,
    '00000000-0000-0000-0000-000000000005',
    'leader',
    'Singer',
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, position = EXCLUDED.position, updated_at = NOW();

  -- Michael as member - Drummer
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000002',
    worship_group1_id,
    '00000000-0000-0000-0000-000000000006',
    'member',
    'Drummer',
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, position = EXCLUDED.position, updated_at = NOW();

  -- Emily as member - Keys
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000003',
    worship_group1_id,
    '00000000-0000-0000-0000-000000000007',
    'member',
    'Keys',
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, position = EXCLUDED.position, updated_at = NOW();

  -- David as member - Bassist
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000004',
    worship_group1_id,
    '00000000-0000-0000-0000-000000000008',
    'member',
    'Bassist',
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, position = EXCLUDED.position, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Group 1';

  -- Assign members to Group 2 (Worship Team)
  -- We'll need more users for Group 2, but for now let's create a structure
  -- Note: You may need to add more users to seed data for a complete Group 2
  -- For now, we'll leave Group 2 empty or add placeholder members if they exist

  RAISE NOTICE 'Group 2 ready for members';

  -- Assign members to Group 1 (Prayer Team)
  -- Lisa as leader
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000005',
    prayer_group1_id,
    '00000000-0000-0000-0000-000000000009',
    'leader',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  -- Jennifer as member
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000006',
    prayer_group1_id,
    '00000000-0000-0000-0000-000000000013',
    'member',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  -- Thomas as member
  INSERT INTO public.team_group_members (id, group_id, user_id, role, position, created_at, updated_at)
  VALUES (
    '40000000-0000-0000-0000-000000000007',
    prayer_group1_id,
    '00000000-0000-0000-0000-000000000014',
    'member',
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Prayer Team Group 1';

  RAISE NOTICE 'Team groups created and members assigned successfully!';
END $$;
