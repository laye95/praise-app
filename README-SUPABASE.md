# Supabase Local Development Setup

This guide will help you set up Supabase locally for the Praise Church App.

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed (`brew install supabase/tap/supabase` on macOS)
- Node.js and npm installed

## Initial Setup

### 1. Start Supabase Local Instance

```bash
supabase start
```

This will start all Supabase services locally using Docker. The first time you run this, it will download the necessary Docker images.

### 2. Get Your Credentials

After starting Supabase, run:

```bash
supabase status
```

You'll see output like:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbG...
service_role key: eyJhbG...
S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
S3 Region: local
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Update the `.env` file with your credentials from `supabase status`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-status>
```

**Important:**

- Use the `API URL` value for `EXPO_PUBLIC_SUPABASE_URL`
- Use the `anon key` value for `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Never commit your `.env` file to git (it's in `.gitignore`)
- Restart your Expo dev server after creating `.env`

### 4. Apply Database Migrations

The migrations are automatically applied when you start Supabase. If you need to reset the database:

```bash
supabase db reset
```

This will:

- Drop all tables and data
- Reapply all migrations from `supabase/migrations/`
- Run all seed files from `supabase/seed/`

## Database Management

### Viewing the Database

Access Supabase Studio (web UI) at:

```
http://127.0.0.1:54323
```

### Creating New Migrations

```bash
supabase migration new <migration_name>
```

Example:

```bash
supabase migration new add_team_members_table
```

This creates a new migration file in `supabase/migrations/` with a timestamp prefix.

### Running Migrations

Migrations are automatically applied when you:

- Run `supabase start` (first time)
- Run `supabase db reset`

To manually apply migrations:

```bash
supabase db push
```

### Seeding the Database

Seed files are in `supabase/seed/` and run in alphabetical order:

- `01_auth_users.sql` - Creates auth users
- `02_users.sql` - Updates public.users roles/churches
- `03_churches.sql` - (Optional) Additional church data

To re-seed:

```bash
supabase db reset
```

## Common Commands

### Start Supabase

```bash
supabase start
```

### Stop Supabase

```bash
supabase stop
```

### Check Status

```bash
supabase status
```

### Reset Database (Destructive!)

```bash
supabase db reset
```

### View Logs

```bash
supabase logs
```

### Generate TypeScript Types

```bash
supabase gen types typescript --local > types/database.ts
```

## Troubleshooting

### Error: "Missing Supabase environment variables"

Make sure you have:

1. Created a `.env` file in the project root
2. Added both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Restarted your Expo development server

### Error: "relation does not exist"

This usually means migrations haven't been applied. Run:

```bash
supabase db reset
```

### Docker Issues

If Docker isn't running or you get connection errors:

1. Start Docker Desktop
2. Wait for it to fully start
3. Run `supabase stop` then `supabase start`

### Port Already in Use

If you see "port already allocated" errors:

```bash
supabase stop
# Wait a few seconds
supabase start
```

## Production Deployment

For production, you'll need to:

1. Create a project at [supabase.com](https://supabase.com)
2. Update your `.env` with production credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   ```
3. Link your local project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
4. Push migrations:
   ```bash
   supabase db push
   ```

## Database Schema

### Tables

- `public.users` - User profiles and roles
- `public.churches` - Church information
- `auth.users` - Supabase auth users (managed by trigger)

### Roles

- `super_admin` - Platform administrator
- `church_admin` - Church administrator (pastor)
- `co_pastor` - Co-pastor with admin rights
- `team_leader` - Team leader
- `team_member` - Team member
- `member` - Regular church member
- `visitor` - Visitor (not yet attached to church)

## Security

- Row Level Security (RLS) is enabled on all tables
- Policies are defined in the migration files
- Auth users are automatically synced to public.users via trigger
- Use service_role key only for admin tasks (never in client code)

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
