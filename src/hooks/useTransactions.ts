import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbTransaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  counterpart_name: string | null;
  counterpart_iban: string | null;
  booking_text: string | null;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTransactions([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);
      setTransactions((data as DbTransaction[]) || []);
      setLoading(false);
    };
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setTransactions(prev => [payload.new as DbTransaction, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { transactions, loading };
};
