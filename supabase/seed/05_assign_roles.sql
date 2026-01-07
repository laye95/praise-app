-- Assign roles to seed users
-- This runs after churches and users are created

DO $$
DECLARE
  church1_id UUID := '10000000-0000-0000-0000-000000000001';
  church2_id UUID := '10000000-0000-0000-0000-000000000002';
  pastor_role_id_1 UUID;
  member_role_id_1 UUID;
  pastor_role_id_2 UUID;
  member_role_id_2 UUID;
BEGIN
  RAISE NOTICE 'Starting role assignment...';
  
  -- Check if roles exist for church 1, if not create them
  SELECT id INTO pastor_role_id_1 FROM public.church_roles 
  WHERE church_id = church1_id AND name = 'Pastor';
  
  IF pastor_role_id_1 IS NULL THEN
    RAISE NOTICE 'Creating default roles for church 1';
    PERFORM public.create_default_church_roles(church1_id);
    
    -- Get the role ID after creation
    SELECT id INTO pastor_role_id_1 FROM public.church_roles 
    WHERE church_id = church1_id AND name = 'Pastor';
  END IF;
  
  SELECT id INTO member_role_id_1 FROM public.church_roles 
  WHERE church_id = church1_id AND name = 'Member';
  
  RAISE NOTICE 'Church 1 - Pastor role ID: %, Member role ID: %', pastor_role_id_1, member_role_id_1;
  
  -- Check if roles exist for church 2, if not create them
  SELECT id INTO pastor_role_id_2 FROM public.church_roles 
  WHERE church_id = church2_id AND name = 'Pastor';
  
  IF pastor_role_id_2 IS NULL THEN
    RAISE NOTICE 'Creating default roles for church 2';
    PERFORM public.create_default_church_roles(church2_id);
  END IF;
  
  -- Assign Pastor role to pastor@praise.test (church_admin of Praise Community Church)
  IF pastor_role_id_1 IS NOT NULL THEN
    INSERT INTO public.user_church_roles (user_id, church_role_id, assigned_by)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      pastor_role_id_1,
      '00000000-0000-0000-0000-000000000002'
    )
    ON CONFLICT (user_id, church_role_id) DO NOTHING;
    RAISE NOTICE 'Assigned Pastor role to pastor@praise.test';
  ELSE
    RAISE WARNING 'Pastor role not found for church 1!';
  END IF;
  
  -- Assign Member role to member@praise.test and all other members
  IF member_role_id_1 IS NOT NULL THEN
    INSERT INTO public.user_church_roles (user_id, church_role_id, assigned_by)
    VALUES 
      ('00000000-0000-0000-0000-000000000003', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000005', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000006', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000007', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000008', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000009', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000010', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000011', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000012', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000013', member_role_id_1, '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000014', member_role_id_1, '00000000-0000-0000-0000-000000000002')
    ON CONFLICT (user_id, church_role_id) DO NOTHING;
    RAISE NOTICE 'Assigned Member role to all church members';
  ELSE
    RAISE WARNING 'Member role not found for church 1!';
  END IF;
  
  -- Verify the assignments
  RAISE NOTICE 'Verification - user_church_roles count: %', (SELECT COUNT(*) FROM public.user_church_roles);
  RAISE NOTICE 'Verification - church_roles count: %', (SELECT COUNT(*) FROM public.church_roles);
  RAISE NOTICE 'Verification - church_role_permissions count: %', (SELECT COUNT(*) FROM public.church_role_permissions);
  
END $$;


