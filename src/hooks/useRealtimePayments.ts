import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  tenant_id: string;
  landlord_id: string;
  unit_id: string;
  created_at: string;
  updated_at: string;
  is_manual_entry: boolean;
  payer_name: string | null;
  payer_phone: string | null;
}

interface UseRealtimePaymentsOptions {
  role: 'landlord' | 'tenant';
}

export function useRealtimePayments({ role }: UseRealtimePaymentsOptions) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase.from('payments').select('*');

      if (role === 'landlord') {
        query = query.eq('landlord_id', user.id);
      } else {
        query = query.eq('tenant_id', user.id);
      }

      const { data, error: fetchError } = await query.order('payment_date', { ascending: false });

      if (fetchError) throw fetchError;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!user) return;

    const filterColumn = role === 'landlord' ? 'landlord_id' : 'tenant_id';
    
    const channel = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `${filterColumn}=eq.${user.id}`
        },
        (payload) => {
          const newPayment = payload.new as Payment;
          setPayments(prev => [newPayment, ...prev]);
          toast.success('New payment received!', {
            description: `Amount: ${newPayment.currency} ${newPayment.amount.toLocaleString()}`
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `${filterColumn}=eq.${user.id}`
        },
        (payload) => {
          const updatedPayment = payload.new as Payment;
          setPayments(prev => 
            prev.map(p => p.id === updatedPayment.id ? updatedPayment : p)
          );
          toast.info('Payment updated', {
            description: `Status: ${updatedPayment.status}`
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'payments',
          filter: `${filterColumn}=eq.${user.id}`
        },
        (payload) => {
          const deletedPayment = payload.old as Payment;
          setPayments(prev => prev.filter(p => p.id !== deletedPayment.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  // Calculate totals
  const totalReceived = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    totalReceived,
    totalPending
  };
}
