import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbContact {
  id: string;
  name: string;
  initials: string;
  iban: string | null;
  avatar_url: string | null;
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setContacts([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setContacts((data as DbContact[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const addContact = async (contact: { name: string; initials: string; iban?: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contact, user_id: user.id })
      .select()
      .single();
    if (!error && data) setContacts(prev => [...prev, data as DbContact]);
    return { data, error };
  };

  return { contacts, loading, addContact };
};
