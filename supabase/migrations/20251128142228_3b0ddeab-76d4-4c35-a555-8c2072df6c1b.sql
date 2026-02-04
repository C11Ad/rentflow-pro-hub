-- Step 1: Drop dependent policies and function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP FUNCTION IF EXISTS has_role(uuid, app_role);

-- Step 2: Update enum
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('admin', 'landlord', 'property_manager', 'tenant');

-- Step 3: Update user_roles table
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- Step 4: Drop old enum
DROP TYPE app_role_old;

-- Step 5: Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 6: Recreate policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and landlords can view tenant profiles"
  ON profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'property_manager') 
    OR has_role(auth.uid(), 'landlord')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Step 7: Create role_requests table
CREATE TABLE public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone
);

-- Step 8: Create verification_documents table
CREATE TABLE public.verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_request_id uuid REFERENCES role_requests(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 9: Enable RLS
ALTER TABLE role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Step 10: RLS Policies for role_requests
CREATE POLICY "Users can view their own role requests"
  ON role_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own role requests"
  ON role_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all role requests"
  ON role_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all role requests"
  ON role_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Landlords can view property manager requests"
  ON role_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'landlord') 
    AND requested_role = 'property_manager'
  );

CREATE POLICY "Landlords can approve property manager requests"
  ON role_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'landlord') 
    AND requested_role = 'property_manager'
  );

-- Step 11: RLS Policies for verification_documents
CREATE POLICY "Users can view their own verification documents"
  ON verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM role_requests 
      WHERE role_requests.id = verification_documents.role_request_id
      AND role_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload their own verification documents"
  ON verification_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_requests 
      WHERE role_requests.id = verification_documents.role_request_id
      AND role_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification documents"
  ON verification_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Landlords can view property manager verification documents"
  ON verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM role_requests
      WHERE role_requests.id = verification_documents.role_request_id
      AND role_requests.requested_role = 'property_manager'
      AND has_role(auth.uid(), 'landlord')
    )
  );

-- Step 12: Add triggers
CREATE TRIGGER update_role_requests_updated_at
  BEFORE UPDATE ON role_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert profile, do NOT assign any role automatically
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  RETURN NEW;
END;
$$;