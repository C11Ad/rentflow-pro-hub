-- Enable realtime for payments table to sync payment updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;