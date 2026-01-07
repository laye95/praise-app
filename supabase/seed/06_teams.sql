-- Seed teams for Praise Community Church
-- This creates teams and assigns members

DO $$
DECLARE
  church1_id UUID := '10000000-0000-0000-0000-000000000001';
  worship_team_id UUID;
  prayer_team_id UUID;
  hospitality_team_id UUID;
  kids_team_id UUID;
  youth_team_id UUID;
BEGIN
  RAISE NOTICE 'Creating teams for Praise Community Church...';

  -- Create Worship Team
  INSERT INTO public.teams (
    id,
    church_id,
    name,
    description,
    type,
    created_at,
    updated_at
  ) VALUES (
    '20000000-0000-0000-0000-000000000001',
    church1_id,
    'Worship Team',
    'Leading worship during Sunday services and special events',
    'worship',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type;

  SELECT id INTO worship_team_id FROM public.teams WHERE id = '20000000-0000-0000-0000-000000000001';
  RAISE NOTICE 'Worship Team ID: %', worship_team_id;

  -- Create Prayer Team
  INSERT INTO public.teams (
    id,
    church_id,
    name,
    description,
    type,
    created_at,
    updated_at
  ) VALUES (
    '20000000-0000-0000-0000-000000000002',
    church1_id,
    'Prayer Team',
    'Praying for church members and community needs',
    'prayer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type;

  SELECT id INTO prayer_team_id FROM public.teams WHERE id = '20000000-0000-0000-0000-000000000002';
  RAISE NOTICE 'Prayer Team ID: %', prayer_team_id;

  -- Create Hospitality Team
  INSERT INTO public.teams (
    id,
    church_id,
    name,
    description,
    type,
    created_at,
    updated_at
  ) VALUES (
    '20000000-0000-0000-0000-000000000003',
    church1_id,
    'Hospitality Team',
    'Welcoming visitors and organizing church events',
    'hospitality',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type;

  SELECT id INTO hospitality_team_id FROM public.teams WHERE id = '20000000-0000-0000-0000-000000000003';
  RAISE NOTICE 'Hospitality Team ID: %', hospitality_team_id;

  -- Create Kids Team
  INSERT INTO public.teams (
    id,
    church_id,
    name,
    description,
    type,
    created_at,
    updated_at
  ) VALUES (
    '20000000-0000-0000-0000-000000000004',
    church1_id,
    'Kids Ministry',
    'Teaching and caring for children during services',
    'kids',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type;

  SELECT id INTO kids_team_id FROM public.teams WHERE id = '20000000-0000-0000-0000-000000000004';
  RAISE NOTICE 'Kids Team ID: %', kids_team_id;

  -- Create Youth Team
  INSERT INTO public.teams (
    id,
    church_id,
    name,
    description,
    type,
    created_at,
    updated_at
  ) VALUES (
    '20000000-0000-0000-0000-000000000005',
    church1_id,
    'Youth Ministry',
    'Leading and mentoring teenagers',
    'youth',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type;

  SELECT id INTO youth_team_id FROM public.teams WHERE id = '20000000-0000-0000-0000-000000000005';
  RAISE NOTICE 'Youth Team ID: %', youth_team_id;

  -- Assign members to Worship Team
  -- Sarah as admin
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (worship_team_id, '00000000-0000-0000-0000-000000000005', 'admin', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  -- Michael, Emily, David as members
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES 
    (worship_team_id, '00000000-0000-0000-0000-000000000006', 'member', NOW(), NOW()),
    (worship_team_id, '00000000-0000-0000-0000-000000000007', 'member', NOW(), NOW()),
    (worship_team_id, '00000000-0000-0000-0000-000000000008', 'member', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Worship Team';

  -- Assign members to Prayer Team
  -- Lisa as admin
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (prayer_team_id, '00000000-0000-0000-0000-000000000009', 'admin', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  -- Jennifer and Thomas as members
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES 
    (prayer_team_id, '00000000-0000-0000-0000-000000000013', 'member', NOW(), NOW()),
    (prayer_team_id, '00000000-0000-0000-0000-000000000014', 'member', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Prayer Team';

  -- Assign members to Hospitality Team
  -- James as admin
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (hospitality_team_id, '00000000-0000-0000-0000-000000000010', 'admin', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  -- Member from church as member
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (hospitality_team_id, '00000000-0000-0000-0000-000000000003', 'member', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Hospitality Team';

  -- Assign members to Kids Team
  -- Maria as admin
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (kids_team_id, '00000000-0000-0000-0000-000000000011', 'admin', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Kids Team';

  -- Assign members to Youth Team
  -- Robert as admin
  INSERT INTO public.team_members (team_id, user_id, role, created_at, updated_at)
  VALUES (youth_team_id, '00000000-0000-0000-0000-000000000012', 'admin', NOW(), NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

  RAISE NOTICE 'Assigned members to Youth Team';

  RAISE NOTICE 'Teams created and members assigned successfully!';
END $$;
