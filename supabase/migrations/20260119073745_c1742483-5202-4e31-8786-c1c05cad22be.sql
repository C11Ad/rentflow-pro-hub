-- Add national_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN national_id TEXT;

-- Create an index for faster lookups on national_id
CREATE INDEX idx_profiles_national_id ON public.profiles(national_id);