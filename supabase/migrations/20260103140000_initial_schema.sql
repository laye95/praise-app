-- Initial Schema Migration
-- This migration sets up the complete database schema for the Praise app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create updated_at trigger function (used by both tables)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  denomination TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  logo_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security for churches
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Create basic policy for churches (view only, update policy will be added after users table exists)
CREATE POLICY "Anyone can view churches"
  ON public.churches FOR SELECT
  USING (true);

-- Allow authenticated users to create churches (for registration)
CREATE POLICY "Authenticated users can create churches"
  ON public.churches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger for churches updated_at
CREATE TRIGGER set_updated_at_churches
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'church_admin', 'co_pastor', 'team_leader', 'team_member', 'member', 'visitor')),
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Create function to check if current user is church admin (bypasses RLS to avoid recursion)
-- NOTE: This is kept for backward compatibility during migration, but will be replaced by has_permission
CREATE OR REPLACE FUNCTION public.is_church_admin(check_church_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_church_id UUID;
  current_user_role TEXT;
BEGIN
  SELECT church_id, role INTO current_user_church_id, current_user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN current_user_church_id = check_church_id 
    AND current_user_role IN ('church_admin', 'co_pastor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user has a specific permission in a church
CREATE OR REPLACE FUNCTION public.has_permission(check_church_id UUID, permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Check if the user has any role in the church that grants this permission
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.user_church_roles ucr ON ucr.user_id = u.id
    INNER JOIN public.church_roles cr ON cr.id = ucr.church_role_id
    INNER JOIN public.church_role_permissions crp ON crp.church_role_id = cr.id
    INNER JOIN public.permissions p ON p.id = crp.permission_id
    WHERE u.id = auth.uid()
      AND u.church_id = check_church_id
      AND cr.church_id = check_church_id
      AND p.key = permission_key
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated;

-- Allow church admins and co-pastors to view members of their church
CREATE POLICY "Church admins can view their church members"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.has_permission(users.church_id, 'members:read'));

-- Create trigger for users updated_at
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Now that users table exists, add the update policy for churches that references users
CREATE POLICY "Church admins can update their church"
  ON public.churches FOR UPDATE
  USING (public.has_permission(churches.id, 'church:update'));

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- RBAC Tables (Roles & Permissions per Church)
-- ============================================================================

-- Global permissions registry
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security for permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Anyone can view permissions (needed for UI)
CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT
  USING (true);

-- Church-specific roles
CREATE TABLE public.church_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(church_id, name)
);

-- Enable Row Level Security for church_roles
ALTER TABLE public.church_roles ENABLE ROW LEVEL SECURITY;

-- Users can view roles for their church
CREATE POLICY "Users can view their church roles"
  ON public.church_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.church_id = church_roles.church_id
      AND users.id = auth.uid()
    )
  );

-- Users with roles:create can create roles
CREATE POLICY "Authorized users can create church roles"
  ON public.church_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission(church_roles.church_id, 'roles:create'));

-- Users with roles:update can update roles
CREATE POLICY "Authorized users can update church roles"
  ON public.church_roles FOR UPDATE
  TO authenticated
  USING (public.has_permission(church_roles.church_id, 'roles:update'))
  WITH CHECK (public.has_permission(church_roles.church_id, 'roles:update'));

-- Users with roles:delete can delete roles (but not system roles)
CREATE POLICY "Authorized users can delete church roles"
  ON public.church_roles FOR DELETE
  TO authenticated
  USING (
    public.has_permission(church_roles.church_id, 'roles:delete')
    AND is_system_role = false
  );

-- Create trigger for church_roles updated_at
CREATE TRIGGER set_updated_at_church_roles
  BEFORE UPDATE ON public.church_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Join table: church_role -> permissions
CREATE TABLE public.church_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_role_id UUID NOT NULL REFERENCES public.church_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(church_role_id, permission_id)
);

-- Enable Row Level Security for church_role_permissions
ALTER TABLE public.church_role_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view role permissions for their church
CREATE POLICY "Users can view their church role permissions"
  ON public.church_role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.church_roles cr
      INNER JOIN public.users u ON u.church_id = cr.church_id
      WHERE cr.id = church_role_permissions.church_role_id
      AND u.id = auth.uid()
    )
  );

-- Users with roles:update can manage role permissions
CREATE POLICY "Authorized users can manage role permissions"
  ON public.church_role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.church_roles cr
      WHERE cr.id = church_role_permissions.church_role_id
      AND public.has_permission(cr.church_id, 'roles:update')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.church_roles cr
      WHERE cr.id = church_role_permissions.church_role_id
      AND public.has_permission(cr.church_id, 'roles:update')
    )
  );

-- Join table: user -> church_roles (multi-role support)
CREATE TABLE public.user_church_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  church_role_id UUID NOT NULL REFERENCES public.church_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, church_role_id)
);

-- Enable Row Level Security for user_church_roles
ALTER TABLE public.user_church_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role assignments
CREATE POLICY "Users can view their own role assignments"
  ON public.user_church_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view role assignments for their church members
CREATE POLICY "Users can view their church member role assignments"
  ON public.user_church_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      INNER JOIN public.users u2 ON u2.church_id = u1.church_id
      WHERE u1.id = auth.uid()
      AND u2.id = user_church_roles.user_id
    )
  );

-- Users with members:roles:assign can assign roles
CREATE POLICY "Authorized users can assign roles"
  ON public.user_church_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      INNER JOIN public.church_roles cr ON cr.id = user_church_roles.church_role_id
      WHERE u.id = user_church_roles.user_id
      AND public.has_permission(u.church_id, 'members:roles:assign')
    )
  );

-- Users with members:roles:assign can remove role assignments
CREATE POLICY "Authorized users can remove role assignments"
  ON public.user_church_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      INNER JOIN public.church_roles cr ON cr.id = user_church_roles.church_role_id
      WHERE u.id = user_church_roles.user_id
      AND public.has_permission(u.church_id, 'members:roles:assign')
    )
  );

-- Insert default permissions
INSERT INTO public.permissions (key, description, category) VALUES
  ('membership_requests:read', 'View membership requests', 'membership'),
  ('membership_requests:accept', 'Accept membership requests', 'membership'),
  ('membership_requests:decline', 'Decline membership requests', 'membership'),
  ('members:read', 'View church members', 'members'),
  ('members:update', 'Update church member information', 'members'),
  ('members:roles:assign', 'Assign roles to church members', 'members'),
  ('church:update', 'Update church information', 'church'),
  ('church:delete', 'Delete church', 'church'),
  ('roles:read', 'View church roles', 'roles'),
  ('roles:create', 'Create new roles', 'roles'),
  ('roles:update', 'Update role permissions', 'roles'),
  ('roles:delete', 'Delete roles', 'roles'),
  ('teams:read', 'View teams', 'teams'),
  ('teams:create', 'Create teams', 'teams'),
  ('teams:update', 'Update teams', 'teams'),
  ('teams:delete', 'Delete teams', 'teams');

-- Create church_membership_requests table
CREATE TABLE public.church_membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security for church_membership_requests
ALTER TABLE public.church_membership_requests ENABLE ROW LEVEL SECURITY;

-- Create partial unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX unique_pending_request_per_church 
  ON public.church_membership_requests (church_id, user_id) 
  WHERE status = 'pending';

-- Create trigger for church_membership_requests updated_at
CREATE TRIGGER set_updated_at_church_membership_requests
  BEFORE UPDATE ON public.church_membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for church_membership_requests

-- Users can insert their own requests
CREATE POLICY "Users can create their own membership requests"
  ON public.church_membership_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own membership requests"
  ON public.church_membership_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can cancel their own pending requests
CREATE POLICY "Users can cancel their own pending requests"
  ON public.church_membership_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Church admins/co-pastors can view requests for their church
CREATE POLICY "Church admins can view their church requests"
  ON public.church_membership_requests FOR SELECT
  TO authenticated
  USING (public.has_permission(church_membership_requests.church_id, 'membership_requests:read'));

-- Church admins/co-pastors can update (accept/decline) requests for their church
CREATE POLICY "Church admins can update their church requests"
  ON public.church_membership_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_permission(church_membership_requests.church_id, 'membership_requests:accept')
    OR public.has_permission(church_membership_requests.church_id, 'membership_requests:decline')
  )
  WITH CHECK (
    public.has_permission(church_membership_requests.church_id, 'membership_requests:accept')
    OR public.has_permission(church_membership_requests.church_id, 'membership_requests:decline')
  );

-- Function to create default roles for a church
CREATE OR REPLACE FUNCTION public.create_default_church_roles(target_church_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pastor_role_id UUID;
  member_role_id UUID;
BEGIN
  -- Create Pastor role (system role with all permissions) if it doesn't exist
  INSERT INTO public.church_roles (church_id, name, description, is_system_role)
  VALUES (target_church_id, 'Pastor', 'Church leadership with full permissions', true)
  ON CONFLICT (church_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO pastor_role_id;
  
  -- If role already existed, get its ID
  IF pastor_role_id IS NULL THEN
    SELECT id INTO pastor_role_id
    FROM public.church_roles
    WHERE church_id = target_church_id AND name = 'Pastor'
    LIMIT 1;
  END IF;
  
  -- Assign all permissions to Pastor role (skip if already assigned)
  INSERT INTO public.church_role_permissions (church_role_id, permission_id)
  SELECT pastor_role_id, p.id
  FROM public.permissions p
  ON CONFLICT (church_role_id, permission_id) DO NOTHING;
  
  -- Create Member role (system role with basic permissions) if it doesn't exist
  INSERT INTO public.church_roles (church_id, name, description, is_system_role)
  VALUES (target_church_id, 'Member', 'Regular church member', true)
  ON CONFLICT (church_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO member_role_id;
  
  -- If role already existed, get its ID
  IF member_role_id IS NULL THEN
    SELECT id INTO member_role_id
    FROM public.church_roles
    WHERE church_id = target_church_id AND name = 'Member'
    LIMIT 1;
  END IF;
  
  -- Assign basic permissions to Member role (skip if already assigned)
  INSERT INTO public.church_role_permissions (church_role_id, permission_id)
  SELECT member_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN ('members:read', 'teams:read')
  ON CONFLICT (church_role_id, permission_id) DO NOTHING;
  
END;
$$;

-- Function to assign pastor role to church creator
CREATE OR REPLACE FUNCTION public.assign_pastor_role_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pastor_role_id UUID;
  creator_id UUID;
BEGIN
  -- Create default roles for the new church
  PERFORM public.create_default_church_roles(NEW.id);
  
  -- Find the pastor role for this church
  SELECT id INTO pastor_role_id
  FROM public.church_roles
  WHERE church_id = NEW.id AND name = 'Pastor'
  LIMIT 1;
  
  -- Find users with church_admin or co_pastor system role for this church
  FOR creator_id IN
    SELECT id FROM public.users
    WHERE church_id = NEW.id
    AND role IN ('church_admin', 'co_pastor')
  LOOP
    -- Assign Pastor role to creator
    INSERT INTO public.user_church_roles (user_id, church_role_id, assigned_by)
    VALUES (creator_id, pastor_role_id, creator_id)
    ON CONFLICT (user_id, church_role_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default roles when a church is created
CREATE TRIGGER on_church_created_assign_roles
  AFTER INSERT ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_pastor_role_to_creator();

-- Function to accept membership request and update user's church_id
-- This function bypasses RLS to allow church admins to update user church_id
CREATE OR REPLACE FUNCTION public.accept_membership_request(request_id UUID)
RETURNS void AS $$
DECLARE
  request_record RECORD;
  admin_user_id UUID;
  member_role_id UUID;
BEGIN
  -- Get the request details
  SELECT 
    cmr.church_id,
    cmr.user_id,
    cmr.status
  INTO request_record
  FROM public.church_membership_requests cmr
  WHERE cmr.id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership request not found';
  END IF;

  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Membership request is not pending';
  END IF;

  -- Get current user
  admin_user_id := auth.uid();

  -- Verify current user has permission to accept membership requests
  IF NOT public.has_permission(request_record.church_id, 'membership_requests:accept') THEN
    RAISE EXCEPTION 'You do not have permission to accept membership requests';
  END IF;

  -- Update the membership request status
  UPDATE public.church_membership_requests
  SET 
    status = 'accepted',
    reviewed_at = NOW(),
    reviewed_by = admin_user_id
  WHERE id = request_id;

  -- Update the user's church_id (bypasses RLS due to SECURITY DEFINER)
  UPDATE public.users
  SET church_id = request_record.church_id
  WHERE id = request_record.user_id;

  -- Assign the default Member role to the new member
  SELECT id INTO member_role_id
  FROM public.church_roles
  WHERE church_id = request_record.church_id AND name = 'Member'
  LIMIT 1;

  IF member_role_id IS NOT NULL THEN
    INSERT INTO public.user_church_roles (user_id, church_role_id, assigned_by)
    VALUES (request_record.user_id, member_role_id, admin_user_id)
    ON CONFLICT (user_id, church_role_id) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_membership_request(UUID) TO authenticated;

-- Function to get user permissions (for app-side caching)
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  target_user_id UUID,
  target_church_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  permission_keys text[];
  user_roles jsonb;
BEGIN
  -- Get all permission keys for the user
  SELECT array_agg(DISTINCT p.key)
  INTO permission_keys
  FROM public.users u
  INNER JOIN public.user_church_roles ucr ON ucr.user_id = u.id
  INNER JOIN public.church_roles cr ON cr.id = ucr.church_role_id
  INNER JOIN public.church_role_permissions crp ON crp.church_role_id = cr.id
  INNER JOIN public.permissions p ON p.id = crp.permission_id
  WHERE u.id = target_user_id
    AND u.church_id = target_church_id
    AND cr.church_id = target_church_id;
  
  -- Get user's roles
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cr.id,
      'church_id', cr.church_id,
      'name', cr.name,
      'description', cr.description,
      'is_system_role', cr.is_system_role,
      'created_at', cr.created_at,
      'updated_at', cr.updated_at
    )
  )
  INTO user_roles
  FROM public.user_church_roles ucr
  INNER JOIN public.church_roles cr ON cr.id = ucr.church_role_id
  WHERE ucr.user_id = target_user_id
    AND cr.church_id = target_church_id;
  
  -- Build result
  result := jsonb_build_object(
    'permissions', COALESCE(to_jsonb(permission_keys), '[]'::jsonb),
    'roles', COALESCE(user_roles, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID, UUID) TO authenticated;

-- Function to remove a member from a church
-- This function bypasses RLS to allow authorized users to remove members
CREATE OR REPLACE FUNCTION public.remove_member_from_church(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_record RECORD;
  admin_user_id UUID;
BEGIN
  -- Get the target user's details
  SELECT id, church_id
  INTO target_user_record
  FROM public.users
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_user_record.church_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any church';
  END IF;

  -- Get current user
  admin_user_id := auth.uid();

  -- Verify current user has permission to update members
  IF NOT public.has_permission(target_user_record.church_id, 'members:update') THEN
    RAISE EXCEPTION 'You do not have permission to remove members from this church';
  END IF;

  -- Remove all team memberships for this user
  DELETE FROM public.team_members
  WHERE user_id = target_user_id
    AND team_id IN (
      SELECT id FROM public.teams
      WHERE church_id = target_user_record.church_id
    );

  -- Remove all role assignments for this church
  DELETE FROM public.user_church_roles
  WHERE user_id = target_user_id
    AND church_role_id IN (
      SELECT id FROM public.church_roles
      WHERE church_id = target_user_record.church_id
    );

  -- Update the user's church_id to NULL (bypasses RLS due to SECURITY DEFINER)
  UPDATE public.users
  SET church_id = NULL
  WHERE id = target_user_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.remove_member_from_church(UUID) TO authenticated;

-- ============================================================================
-- Teams Tables (Team Management)
-- ============================================================================

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('worship', 'prayer', 'hospitality', 'media', 'kids', 'youth', 'outreach', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(church_id, name)
);

-- Create index on church_id for faster queries
CREATE INDEX idx_teams_church_id ON public.teams(church_id);

-- Create index on type for filtering
CREATE INDEX idx_teams_type ON public.teams(type);

-- Enable Row Level Security for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create trigger for teams updated_at
CREATE TRIGGER set_updated_at_teams
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for teams

-- Users with teams:read can view teams for their church
CREATE POLICY "Users can view teams for their church"
  ON public.teams FOR SELECT
  TO authenticated
  USING (public.has_permission(church_id, 'teams:read'));

-- Users with teams:create can create teams
CREATE POLICY "Authorized users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission(church_id, 'teams:create'));

-- Users with teams:update can update teams
CREATE POLICY "Authorized users can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.has_permission(church_id, 'teams:update'))
  WITH CHECK (public.has_permission(church_id, 'teams:update'));

-- Users with teams:delete can delete teams
CREATE POLICY "Authorized users can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.has_permission(church_id, 'teams:delete'));

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);

-- Enable Row Level Security for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members

-- Users with teams:read can view team members for teams in their church
CREATE POLICY "Users can view team members for their church teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND public.has_permission(t.church_id, 'teams:read')
    )
  );

-- Function to check if current user is a team leader
CREATE OR REPLACE FUNCTION public.is_team_leader(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_leader BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = check_team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'leader'
  ) INTO is_leader;
  
  RETURN COALESCE(is_leader, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_team_leader(UUID) TO authenticated;

-- Users with teams:update can add team members with any role
-- Team leaders can add members (but only with role='member', no privilege escalation)
CREATE POLICY "Authorized users and team leaders can add team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id
        AND public.has_permission(t.church_id, 'teams:update')
      )
    )
    OR (
      public.is_team_leader(team_members.team_id)
      AND team_members.role = 'member'
    )
  );

-- Users with teams:update can remove any team members
-- Team leaders can remove members (but only members, not other leaders)
CREATE POLICY "Authorized users and team leaders can remove team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id
        AND public.has_permission(t.church_id, 'teams:update')
      )
    )
    OR (
      public.is_team_leader(team_members.team_id)
      AND team_members.role = 'member'
    )
  );

-- Users with teams:update can update team member roles
CREATE POLICY "Authorized users can update team member roles"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  );

-- ============================================================================
-- User Settings Table (Future-proof settings storage)
-- ============================================================================

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on user_id for fast lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- Create GIN index on settings JSONB for efficient JSON queries
CREATE INDEX idx_user_settings_settings_gin ON public.user_settings USING GIN (settings);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to get a specific setting value
CREATE OR REPLACE FUNCTION public.get_user_setting(p_user_id UUID, p_setting_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT settings->p_setting_key INTO setting_value
  FROM public.user_settings
  WHERE user_id = p_user_id;
  
  RETURN setting_value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_setting(UUID, TEXT) TO authenticated;

-- Create function to set a specific setting value
CREATE OR REPLACE FUNCTION public.set_user_setting(p_user_id UUID, p_setting_key TEXT, p_setting_value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_settings JSONB;
  user_exists BOOLEAN;
  retry_count INTEGER := 0;
BEGIN
  -- Check if user exists in public.users (wait for trigger if needed)
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) INTO user_exists;
    
    IF user_exists THEN
      EXIT;
    END IF;
    
    -- Wait up to 3 times (300ms total) for the trigger to create the user
    IF retry_count >= 3 THEN
      RAISE EXCEPTION 'User record not found in public.users. Trigger may not have completed yet.';
    END IF;
    
    PERFORM pg_sleep(0.1);
    retry_count := retry_count + 1;
  END LOOP;
  
  -- Insert or update the settings
  INSERT INTO public.user_settings (user_id, settings)
  VALUES (p_user_id, jsonb_build_object(p_setting_key, p_setting_value))
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    settings = user_settings.settings || jsonb_build_object(p_setting_key, p_setting_value),
    updated_at = NOW()
  RETURNING settings INTO updated_settings;
  
  RETURN updated_settings;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_user_setting(UUID, TEXT, JSONB) TO authenticated;

-- Function to assign Pastor role to church creator (callable as RPC)
CREATE OR REPLACE FUNCTION public.assign_pastor_role_to_user(
  p_user_id UUID,
  p_church_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pastor_role_id UUID;
BEGIN
  -- Ensure default roles exist for the church
  PERFORM public.create_default_church_roles(p_church_id);
  
  -- Find the pastor role for this church
  SELECT id INTO pastor_role_id
  FROM public.church_roles
  WHERE church_id = p_church_id AND name = 'Pastor'
  LIMIT 1;
  
  IF pastor_role_id IS NULL THEN
    RAISE EXCEPTION 'Pastor role not found for church';
  END IF;
  
  -- Assign Pastor role to user (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.user_church_roles (user_id, church_role_id, assigned_by)
  VALUES (p_user_id, pastor_role_id, p_user_id)
  ON CONFLICT (user_id, church_role_id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_pastor_role_to_user(UUID, UUID) TO authenticated;

