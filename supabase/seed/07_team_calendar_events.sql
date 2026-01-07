-- Seed calendar events for Worship Team
-- This creates sample calendar events with role assignments and PDF documents

DO $$
DECLARE
  worship_team_id UUID := '20000000-0000-0000-0000-000000000001';
  event1_id UUID;
  event2_id UUID;
  event3_id UUID;
  event4_id UUID;
  event5_id UUID;
  event6_id UUID;
  event7_id UUID;
  event8_id UUID;
  event9_id UUID;
  event10_id UUID;
BEGIN
  RAISE NOTICE 'Creating calendar events for Worship Team...';

  -- ============================================
  -- SAME DATE EVENTS (Sunday - CURRENT_DATE + 7 days)
  -- ============================================

  -- Event 1: Morning Service (9am)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000001',
    worship_team_id,
    CURRENT_DATE + INTERVAL '7 days',
    '09:00:00',
    '11:00:00',
    false,
    'Sunday Morning Service',
    'First service of the day - Traditional worship',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event1_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000001';

  -- Set positions for team members (primary role/position in the team)
  -- Sarah (admin) - Worship Leader
  UPDATE public.team_members
  SET position = 'Worship Leader', updated_at = NOW()
  WHERE team_id = worship_team_id AND user_id = '00000000-0000-0000-0000-000000000005';

  -- Michael - Drums
  UPDATE public.team_members
  SET position = 'Drums', updated_at = NOW()
  WHERE team_id = worship_team_id AND user_id = '00000000-0000-0000-0000-000000000006';

  -- Emily - Piano/Keys
  UPDATE public.team_members
  SET position = 'Keys', updated_at = NOW()
  WHERE team_id = worship_team_id AND user_id = '00000000-0000-0000-0000-000000000007';

  -- David - Backing Vocals
  UPDATE public.team_members
  SET position = 'Backing Vocals', updated_at = NOW()
  WHERE team_id = worship_team_id AND user_id = '00000000-0000-0000-0000-000000000008';

  RAISE NOTICE 'Created event 1: Sunday Morning Service';

  -- Event 2: Youth Service (11:30am - SAME DAY)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000002',
    worship_team_id,
    CURRENT_DATE + INTERVAL '7 days',
    '11:30:00',
    '13:00:00',
    false,
    'Youth Service',
    'Contemporary worship for youth - High energy!',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event2_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000002';

  RAISE NOTICE 'Created event 2: Youth Service (same day as event 1)';

  -- Event 3: Evening Service (6pm - SAME DAY)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000003',
    worship_team_id,
    CURRENT_DATE + INTERVAL '7 days',
    '18:00:00',
    '19:30:00',
    false,
    'Evening Worship',
    'Intimate acoustic worship session',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event3_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000003';


  RAISE NOTICE 'Created event 3: Evening Worship (same day as events 1 & 2)';

  -- ============================================
  -- REHEARSALS (Saturday - CURRENT_DATE + 6 days)
  -- ============================================

  -- Event 4: Morning Rehearsal
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000004',
    worship_team_id,
    CURRENT_DATE + INTERVAL '6 days',
    '10:00:00',
    '12:00:00',
    false,
    'Morning Service Rehearsal',
    'Practice for Sunday morning traditional service',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event4_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000004';

  RAISE NOTICE 'Created event 4: Morning Service Rehearsal';

  -- Event 5: Youth Rehearsal (SAME DAY)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000005',
    worship_team_id,
    CURRENT_DATE + INTERVAL '6 days',
    '14:00:00',
    '16:00:00',
    false,
    'Youth Service Rehearsal',
    'Practice contemporary songs for youth service',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event5_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000005';

  RAISE NOTICE 'Created event 5: Youth Service Rehearsal (same day as event 4)';

  -- ============================================
  -- NEXT SUNDAY (CURRENT_DATE + 14 days)
  -- ============================================

  -- Event 6: Sunday Service
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000006',
    worship_team_id,
    CURRENT_DATE + INTERVAL '14 days',
    '09:00:00',
    '11:00:00',
    false,
    'Sunday Morning Service',
    'Regular Sunday worship service',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event6_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000006';


  RAISE NOTICE 'Created event 6: Next Sunday Service';

  -- ============================================
  -- SPECIAL EVENTS
  -- ============================================

  -- Event 7: Easter Service (all-day multi-day event)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    end_date,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000007',
    worship_team_id,
    CURRENT_DATE + INTERVAL '21 days',
    CURRENT_DATE + INTERVAL '22 days',
    true,
    'Easter Celebration',
    'Special Easter celebration service spanning two days',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    end_date = EXCLUDED.end_date,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event7_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000007';


  RAISE NOTICE 'Created event 7: Easter Service (all-day, multi-day)';

  -- Event 8: Team Building Day (all-day single day)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000008',
    worship_team_id,
    CURRENT_DATE + INTERVAL '10 days',
    true,
    'Team Building Day',
    'All-day team building and fellowship activities',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event8_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000008';

  RAISE NOTICE 'Created event 8: Team Building Day (all-day)';

  -- Event 9: Midweek Prayer (Wednesday)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000009',
    worship_team_id,
    CURRENT_DATE + INTERVAL '3 days',
    '19:00:00',
    '20:00:00',
    false,
    'Midweek Prayer & Worship',
    'Evening prayer and worship session',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event9_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000009';

  RAISE NOTICE 'Created event 9: Midweek Prayer & Worship';

  -- Event 10: Special Concert (Friday)
  INSERT INTO public.team_calendar_events (
    id,
    team_id,
    date,
    start_time,
    end_time,
    is_all_day,
    title,
    description,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    '30000000-0000-0000-0000-000000000010',
    worship_team_id,
    CURRENT_DATE + INTERVAL '5 days',
    '19:30:00',
    '21:30:00',
    false,
    'Worship Night Concert',
    'Special worship concert open to the community',
    '00000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    is_all_day = EXCLUDED.is_all_day,
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  SELECT id INTO event10_id FROM public.team_calendar_events WHERE id = '30000000-0000-0000-0000-000000000010';


  RAISE NOTICE 'Created event 10: Worship Night Concert';

  -- ============================================
  -- ADD PDF DOCUMENTS
  -- ============================================

  RAISE NOTICE 'Creating sample PDF documents...';

  -- Documents for Event 1 (Morning Service)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000001',
      worship_team_id,
      event1_id,
      'Morning Service - Song List.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      245760,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000002',
      worship_team_id,
      event1_id,
      'How Great Thou Art - Sheet Music.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      389120,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000003',
      worship_team_id,
      event1_id,
      'Amazing Grace - Chord Chart.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      156672,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 3 documents for Morning Service';

  -- Documents for Event 2 (Youth Service)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000004',
      worship_team_id,
      event2_id,
      'Youth Service - Set List.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      198656,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000005',
      worship_team_id,
      event2_id,
      'Oceans (Where Feet May Fail) - Lead Sheet.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      423936,
      'application/pdf',
      '00000000-0000-0000-0000-000000000008',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 2 documents for Youth Service';

  -- Documents for Event 3 (Evening Worship)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000006',
      worship_team_id,
      event3_id,
      'Evening Worship - Acoustic Arrangements.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      512000,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 1 document for Evening Worship';

  -- Documents for Event 7 (Easter)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000007',
      worship_team_id,
      event7_id,
      'Easter Service - Complete Set.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      1048576,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000008',
      worship_team_id,
      event7_id,
      'Christ the Lord is Risen Today - Full Score.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      678912,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 2 documents for Easter Service';

  -- Documents for Event 10 (Concert)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000009',
      worship_team_id,
      event10_id,
      'Concert Set List & Running Order.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      334848,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000010',
      worship_team_id,
      event10_id,
      'Goodness of God - Full Band Chart.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      445440,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000011',
      worship_team_id,
      event10_id,
      'Way Maker - Drum Chart.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      223232,
      'application/pdf',
      '00000000-0000-0000-0000-000000000006',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 3 documents for Concert';

  -- General team documents (not linked to specific events)
  INSERT INTO public.team_documents (
    id,
    team_id,
    event_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    uploaded_by,
    created_at,
    updated_at
  ) VALUES 
    (
      '40000000-0000-0000-0000-000000000012',
      worship_team_id,
      NULL,
      'Worship Team Handbook.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      2097152,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    ),
    (
      '40000000-0000-0000-0000-000000000013',
      worship_team_id,
      NULL,
      'Standard Song List - 2024.pdf',
      'https://placeholder.supabase.co/storage/v1/object/public/team-documents/test/example.pdf',
      892928,
      'application/pdf',
      '00000000-0000-0000-0000-000000000005',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    file_size = EXCLUDED.file_size;

  RAISE NOTICE 'Created 2 general team documents';

  RAISE NOTICE 'Calendar events and documents created successfully!';
  RAISE NOTICE 'Total Events: 10';
  RAISE NOTICE 'Total Documents: 13';
  RAISE NOTICE 'Events on same day examples:';
  RAISE NOTICE '  - Sunday: 3 events (Morning, Youth, Evening)';
  RAISE NOTICE '  - Saturday: 2 events (Morning & Youth Rehearsal)';
END $$;
