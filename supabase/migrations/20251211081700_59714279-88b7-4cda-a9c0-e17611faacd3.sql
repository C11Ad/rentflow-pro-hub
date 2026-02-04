-- Add RLS policy to allow users to insert their own tenant role during signup
CREATE POLICY "Users can insert their own tenant role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'tenant'::app_role
);