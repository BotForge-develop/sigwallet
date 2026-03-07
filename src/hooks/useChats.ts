import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbChat {
  id: string;
  sender_id: string;
  recipient_contact_id: string | null;
  message_type: string;
  text: string | null;
  amount: number | null;
  created_at: string;
}

export const useChats = (contactId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !contactId) { setMessages([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('sender_id', user.id)
        .eq('recipient_contact_id', contactId)
        .order('created_at', { ascending: true });
      setMessages((data as DbChat[]) || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`chats-${contactId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: `recipient_contact_id=eq.${contactId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DbChat]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, contactId]);

  const sendMessage = async (text: string) => {
    if (!user || !contactId) return;
    await supabase.from('chats').insert({
      sender_id: user.id,
      recipient_contact_id: contactId,
      message_type: 'text',
      text,
    });
  };

  const sendTransfer = async (amount: number) => {
    if (!user || !contactId) return;
    await supabase.from('chats').insert({
      sender_id: user.id,
      recipient_contact_id: contactId,
      message_type: 'transfer',
      amount,
    });
  };

  return { messages, loading, sendMessage, sendTransfer };
};
