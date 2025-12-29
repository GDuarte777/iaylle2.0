import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  interval: string;
  description: string;
  features: any[];
  color?: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
  plan: Plan;
}

export interface Payment {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string;
  created_at: string;
}

export function useSubscription() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Subscription with Plan
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .maybeSingle();

      if (subError) throw subError;

      if (subData) {
        setSubscription(subData as unknown as Subscription);
      } else {
        setSubscription(null);
      }

      // 2. Fetch Payments
      if (subData) {
        const { data: payData, error: payError } = await supabase
          .from('payments')
          .select('*')
          .eq('subscription_id', subData.id)
          .order('created_at', { ascending: false });

        if (payError) throw payError;
        setPayments(payData || []);
      } else {
        setPayments([]);
      }

    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    payments,
    loading,
    error,
    refresh: fetchSubscription
  };
}
