-- Seed churches table
INSERT INTO public.churches (
  id,
  name,
  denomination,
  location,
  timezone,
  logo_url,
  cover_image_url
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Praise Community Church',
    'Non-Denominational',
    'New York, NY',
    'America/New_York',
    NULL,
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Grace Fellowship',
    'Baptist',
    'Los Angeles, CA',
    'America/Los_Angeles',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  denomination = EXCLUDED.denomination,
  location = EXCLUDED.location,
  timezone = EXCLUDED.timezone,
  logo_url = EXCLUDED.logo_url,
  cover_image_url = EXCLUDED.cover_image_url;
