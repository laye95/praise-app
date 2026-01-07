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
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
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

-- Helper function to check if user is a team admin (replaces is_team_leader)
CREATE OR REPLACE FUNCTION public.is_team_admin(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = check_team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'admin'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_team_admin(UUID) TO authenticated;

-- Function to check if current user is a team leader (deprecated, will be dropped)
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

-- Drop old UPDATE policy that uses is_team_leader
DROP POLICY IF EXISTS "Authorized users can update team member roles" ON public.team_members;

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
    OR public.is_team_admin(team_members.team_id)
    OR team_members.user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
    OR public.is_team_admin(team_members.team_id)
    OR team_members.user_id = auth.uid()
  );

-- Migrate existing team_members roles from 'leader' to 'admin'
UPDATE public.team_members
SET role = 'admin'
WHERE role = 'leader';

-- Update team_members role constraint to use 'admin' instead of 'leader'
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_role_check CHECK (role IN ('admin', 'member'));

-- Note: team_calendar_assignments table is not created in this migration
-- Positions are set via seed files or managed directly in team_members.position

-- Drop RLS policies that depend on is_team_leader first (must be done before dropping function)
DROP POLICY IF EXISTS "Authorized users and team leaders can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Authorized users and team leaders can remove team members" ON public.team_members;

-- Drop is_team_leader function (CASCADE will drop any remaining dependencies)
DROP FUNCTION IF EXISTS public.is_team_leader(UUID) CASCADE;

-- Create new RLS policies using is_team_admin

CREATE POLICY "Authorized users and team admins can add team members"
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
      public.is_team_admin(team_members.team_id)
      AND team_members.role = 'member'
    )
  );

CREATE POLICY "Authorized users and team admins can remove team members"
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
      public.is_team_admin(team_members.team_id)
      AND team_members.role = 'member'
    )
  );

-- ============================================================================
-- Team Groups Tables (Groups within teams)
-- ============================================================================

-- Create team_groups table
CREATE TABLE public.team_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, name)
);

CREATE INDEX idx_team_groups_team_id ON public.team_groups(team_id);
ALTER TABLE public.team_groups ENABLE ROW LEVEL SECURITY;

-- Create team_group_members table
CREATE TABLE public.team_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.team_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_team_group_members_group_id ON public.team_group_members(group_id);
CREATE INDEX idx_team_group_members_user_id ON public.team_group_members(user_id);
ALTER TABLE public.team_group_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_updated_at_team_group_members
  BEFORE UPDATE ON public.team_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user is already in another group in the same team
CREATE OR REPLACE FUNCTION public.is_user_in_team_group(
  check_team_id UUID,
  check_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_group_id UUID;
BEGIN
  SELECT tgm.group_id INTO existing_group_id
  FROM public.team_group_members tgm
  INNER JOIN public.team_groups tg ON tg.id = tgm.group_id
  WHERE tg.team_id = check_team_id
    AND tgm.user_id = check_user_id
  LIMIT 1;
  
  RETURN existing_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_in_team_group(UUID, UUID) TO authenticated;

-- Function to check if current user is a group leader
CREATE OR REPLACE FUNCTION public.is_group_leader(check_group_id UUID)
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
    FROM public.team_group_members tgm
    WHERE tgm.group_id = check_group_id
    AND tgm.user_id = auth.uid()
    AND tgm.role = 'leader'
  ) INTO is_leader;
  
  RETURN COALESCE(is_leader, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_group_leader(UUID) TO authenticated;

-- Function to get user's group for a team
CREATE OR REPLACE FUNCTION public.get_user_group_for_team(
  check_team_id UUID,
  check_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_id UUID;
BEGIN
  SELECT tgm.group_id INTO group_id
  FROM public.team_group_members tgm
  INNER JOIN public.team_groups tg ON tg.id = tgm.group_id
  WHERE tg.team_id = check_team_id
    AND tgm.user_id = check_user_id
  LIMIT 1;
  
  RETURN group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_group_for_team(UUID, UUID) TO authenticated;

-- Function to check if user can update group member role
CREATE OR REPLACE FUNCTION public.can_update_group_member_role(
  check_group_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  team_id UUID;
  church_id UUID;
  is_admin BOOLEAN;
  is_leader BOOLEAN;
BEGIN
  SELECT tg.team_id, t.church_id INTO team_id, church_id
  FROM public.team_groups tg
  INNER JOIN public.teams t ON t.id = tg.team_id
  WHERE tg.id = check_group_id;
  
  IF team_id IS NULL OR church_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT public.has_permission(church_id, 'teams:update') INTO is_admin;
  
  SELECT public.is_group_leader(check_group_id) INTO is_leader;
  
  IF new_role = 'leader' THEN
    RETURN COALESCE(is_admin, false);
  ELSE
    RETURN COALESCE(is_admin, false) OR COALESCE(is_leader, false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_update_group_member_role(UUID, TEXT) TO authenticated;

-- Trigger function to enforce exclusive group membership (one group per team per user)
CREATE OR REPLACE FUNCTION public.enforce_exclusive_group_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  team_id UUID;
  existing_group_id UUID;
BEGIN
  -- Get the team_id for this group
  SELECT tg.team_id INTO team_id
  FROM public.team_groups tg
  WHERE tg.id = NEW.group_id;
  
  -- Check if user is already in another group in this team
  SELECT public.get_user_group_for_team(team_id, NEW.user_id) INTO existing_group_id;
  
  IF existing_group_id IS NOT NULL AND existing_group_id != NEW.group_id THEN
    RAISE EXCEPTION 'User is already a member of another group in this team';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_exclusive_group_membership_trigger
  BEFORE INSERT OR UPDATE ON public.team_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_exclusive_group_membership();

-- RLS Policies for team_groups

-- Users with teams:read can view groups for their church teams
CREATE POLICY "Users can view groups for their church teams"
  ON public.team_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_groups.team_id
      AND public.has_permission(t.church_id, 'teams:read')
    )
  );

-- Users with teams:update can create groups
CREATE POLICY "Authorized users can create groups"
  ON public.team_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_groups.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  );

-- Users with teams:update can update groups
CREATE POLICY "Authorized users can update groups"
  ON public.team_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_groups.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_groups.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  );

-- Users with teams:update can delete groups
CREATE POLICY "Authorized users can delete groups"
  ON public.team_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_groups.team_id
      AND public.has_permission(t.church_id, 'teams:update')
    )
  );

-- RLS Policies for team_group_members

-- Users with teams:read can view group members for their church teams
CREATE POLICY "Users can view group members for their church teams"
  ON public.team_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_groups tg
      INNER JOIN public.teams t ON t.id = tg.team_id
      WHERE tg.id = team_group_members.group_id
      AND public.has_permission(t.church_id, 'teams:read')
    )
  );

-- Team admins and group leaders can add group members
CREATE POLICY "Authorized users and group leaders can add group members"
  ON public.team_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.team_groups tg
        INNER JOIN public.teams t ON t.id = tg.team_id
        WHERE tg.id = team_group_members.group_id
        AND public.has_permission(t.church_id, 'teams:update')
      )
    )
    OR (
      public.is_group_leader(team_group_members.group_id)
      AND team_group_members.role = 'member'
    )
  );

-- Team admins and group leaders can remove group members
CREATE POLICY "Authorized users and group leaders can remove group members"
  ON public.team_group_members FOR DELETE
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.team_groups tg
        INNER JOIN public.teams t ON t.id = tg.team_id
        WHERE tg.id = team_group_members.group_id
        AND public.has_permission(t.church_id, 'teams:update')
      )
    )
    OR (
      public.is_group_leader(team_group_members.group_id)
      AND team_group_members.role = 'member'
    )
  );

-- Team admins and church admins can update any role, group leaders can only update member roles
CREATE POLICY "Authorized users and group leaders can update group member roles"
  ON public.team_group_members FOR UPDATE
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.team_groups tg
        INNER JOIN public.teams t ON t.id = tg.team_id
        WHERE tg.id = team_group_members.group_id
        AND (
          public.has_permission(t.church_id, 'teams:update')
          OR public.is_team_admin(t.id)
        )
      )
    )
    OR (
      public.is_group_leader(team_group_members.group_id)
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.team_groups tg
        INNER JOIN public.teams t ON t.id = tg.team_id
        WHERE tg.id = team_group_members.group_id
        AND (
          public.has_permission(t.church_id, 'teams:update')
          OR public.is_team_admin(t.id)
        )
      )
    )
    OR (
      public.is_group_leader(team_group_members.group_id)
      AND team_group_members.role = 'member'
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

-- ============================================================================
-- Team Calendar and Documents Feature
-- ============================================================================

-- Create team_calendar_events table
CREATE TABLE public.team_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.team_groups(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_team_calendar_events_team_id ON public.team_calendar_events(team_id);
CREATE INDEX idx_team_calendar_events_group_id ON public.team_calendar_events(group_id);
CREATE INDEX idx_team_calendar_events_date ON public.team_calendar_events(date);
CREATE INDEX idx_team_calendar_events_end_date ON public.team_calendar_events(end_date);

-- Create team_calendar_event_members table for individual member assignments
CREATE TABLE public.team_calendar_event_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.team_calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_team_calendar_event_members_event_id ON public.team_calendar_event_members(event_id);
CREATE INDEX idx_team_calendar_event_members_user_id ON public.team_calendar_event_members(user_id);
ALTER TABLE public.team_calendar_event_members ENABLE ROW LEVEL SECURITY;

-- Note: Team member positions are stored in team_members.position
-- This allows team admins and members themselves to manage their positions
-- Events can either have a group_id assigned OR individual members via team_calendar_event_members

-- Create team_documents table
CREATE TABLE public.team_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.team_calendar_events(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_team_documents_team_id ON public.team_documents(team_id);
CREATE INDEX idx_team_documents_event_id ON public.team_documents(event_id);

-- Helper function: Check if user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = check_team_id
    AND tm.user_id = auth.uid()
  ) INTO is_member;
  
  RETURN COALESCE(is_member, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID) TO authenticated;

-- Helper function: Check if team is worship team
CREATE OR REPLACE FUNCTION public.is_worship_team(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_type TEXT;
BEGIN
  SELECT type INTO team_type
  FROM public.teams
  WHERE id = check_team_id;
  
  RETURN team_type = 'worship';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_worship_team(UUID) TO authenticated;

-- Helper function: Check if user has Pastor role in church
CREATE OR REPLACE FUNCTION public.is_pastor(check_church_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_pastor_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.user_church_roles ucr ON ucr.user_id = u.id
    INNER JOIN public.church_roles cr ON cr.id = ucr.church_role_id
    WHERE u.id = auth.uid()
      AND cr.church_id = check_church_id
      AND cr.name = 'Pastor'
  ) INTO is_pastor_role;
  
  RETURN COALESCE(is_pastor_role, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_pastor(UUID) TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.team_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for team_calendar_events
-- ============================================================================

-- Team members and pastors can view calendar events
CREATE POLICY "Team members and pastors can view calendar events"
  ON public.team_calendar_events FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(team_id)
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_calendar_events.team_id
      AND public.is_pastor(t.church_id)
    )
  );

-- Team leaders, pastors, and admins can create calendar events
CREATE POLICY "Team leaders, pastors, and admins can create calendar events"
  ON public.team_calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_calendar_events.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_calendar_events.team_id)
          AND public.is_team_admin(team_calendar_events.team_id)
        )
      )
    )
  );

-- Team leaders, pastors, and admins can update calendar events
CREATE POLICY "Team leaders, pastors, and admins can update calendar events"
  ON public.team_calendar_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_calendar_events.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_calendar_events.team_id)
          AND public.is_team_admin(team_calendar_events.team_id)
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_calendar_events.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_calendar_events.team_id)
          AND public.is_team_admin(team_calendar_events.team_id)
        )
      )
    )
  );

-- Team leaders, pastors, and admins can delete calendar events
CREATE POLICY "Team leaders, pastors, and admins can delete calendar events"
  ON public.team_calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_calendar_events.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_calendar_events.team_id)
          AND public.is_team_admin(team_calendar_events.team_id)
        )
      )
    )
  );

-- ============================================================================
-- RLS Policies for team_calendar_event_members
-- ============================================================================

-- Team members and pastors can view event member assignments
CREATE POLICY "Team members and pastors can view event member assignments"
  ON public.team_calendar_event_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_calendar_events tce
      WHERE tce.id = team_calendar_event_members.event_id
      AND (
        public.is_team_member(tce.team_id)
        OR EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = tce.team_id
          AND public.is_pastor(t.church_id)
        )
      )
    )
  );

-- Team leaders, pastors, and admins can manage event member assignments
CREATE POLICY "Team leaders, pastors, and admins can manage event member assignments"
  ON public.team_calendar_event_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_calendar_events tce
      WHERE tce.id = team_calendar_event_members.event_id
      AND EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = tce.team_id
        AND (
          public.is_pastor(t.church_id)
          OR public.has_permission(t.church_id, 'teams:update')
          OR (
            public.is_team_member(tce.team_id)
            AND public.is_team_admin(tce.team_id)
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_calendar_events tce
      WHERE tce.id = team_calendar_event_members.event_id
      AND EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = tce.team_id
        AND (
          public.is_pastor(t.church_id)
          OR public.has_permission(t.church_id, 'teams:update')
          OR (
            public.is_team_member(tce.team_id)
            AND public.is_team_admin(tce.team_id)
          )
        )
      )
    )
  );

-- ============================================================================
-- Note: Team member positions are stored in team_members.position
-- Team admins and members themselves can update position via the team_members UPDATE policy
-- Events can either have a group_id assigned OR individual members via team_calendar_event_members

-- ============================================================================
-- RLS Policies for team_documents
-- ============================================================================

-- Worship team members and pastors can view documents
CREATE POLICY "Worship team members and pastors can view documents"
  ON public.team_documents FOR SELECT
  TO authenticated
  USING (
    public.is_worship_team(team_id)
    AND (
      public.is_team_member(team_id)
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_documents.team_id
        AND public.is_pastor(t.church_id)
      )
    )
  );

-- All worship team members and pastors can upload documents
CREATE POLICY "Worship team members and pastors can upload documents"
  ON public.team_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_worship_team(team_id)
    AND (
      public.is_team_member(team_id)
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_documents.team_id
        AND public.is_pastor(t.church_id)
      )
    )
  );

-- Only worship team leaders and pastors can update documents
CREATE POLICY "Worship team leaders and pastors can update documents"
  ON public.team_documents FOR UPDATE
  TO authenticated
  USING (
    public.is_worship_team(team_id)
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_documents.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_documents.team_id)
          AND public.is_team_admin(team_documents.team_id)
        )
      )
    )
  )
  WITH CHECK (
    public.is_worship_team(team_id)
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_documents.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_documents.team_id)
          AND public.is_team_admin(team_documents.team_id)
        )
      )
    )
  );

-- Only worship team leaders and pastors can delete documents
CREATE POLICY "Worship team leaders and pastors can delete documents"
  ON public.team_documents FOR DELETE
  TO authenticated
  USING (
    public.is_worship_team(team_id)
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_documents.team_id
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(team_documents.team_id)
          AND public.is_team_admin(team_documents.team_id)
        )
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_calendar_events_updated_at
  BEFORE UPDATE ON public.team_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_documents_updated_at
  BEFORE UPDATE ON public.team_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Storage Bucket Setup for Team Documents
-- ============================================================================

-- Create storage bucket for team documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-documents',
  'team-documents',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage Bucket
-- Worship team members and pastors can view files
CREATE POLICY "Worship team members and pastors can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'team-documents'
    AND EXISTS (
      SELECT 1 FROM public.team_documents td
      JOIN public.teams t ON t.id = td.team_id
      WHERE td.file_url LIKE '%' || storage.objects.name || '%'
      AND public.is_worship_team(td.team_id)
      AND (
        public.is_team_member(td.team_id)
        OR public.is_pastor(t.church_id)
      )
    )
  );

-- All worship team members and pastors can upload files
CREATE POLICY "Worship team members and pastors can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-documents'
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id::text = split_part(storage.objects.name, '/', 1)
      AND public.is_worship_team(t.id)
      AND (
        public.is_team_member(t.id)
        OR public.is_pastor(t.church_id)
      )
    )
  );

-- Only worship team leaders and pastors can delete files
CREATE POLICY "Worship team leaders and pastors can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'team-documents'
    AND EXISTS (
      SELECT 1 FROM public.team_documents td
      JOIN public.teams t ON t.id = td.team_id
      WHERE td.file_url LIKE '%' || storage.objects.name || '%'
      AND public.is_worship_team(td.team_id)
      AND (
        public.is_pastor(t.church_id)
        OR public.has_permission(t.church_id, 'teams:update')
        OR (
          public.is_team_member(td.team_id)
          AND public.is_team_admin(td.team_id)
        )
      )
    )
  );

