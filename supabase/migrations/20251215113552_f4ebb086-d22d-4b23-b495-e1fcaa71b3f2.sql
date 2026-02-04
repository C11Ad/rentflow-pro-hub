-- Enable realtime for profiles table to sync currency changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;