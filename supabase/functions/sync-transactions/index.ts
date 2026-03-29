import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== Deno.env.get('SYNC_API_KEY')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { user_id, transactions } = await req.json();

    if (!user_id || !transactions || !Array.isArray(transactions)) {
      return new Response(JSON.stringify({ error: 'Missing user_id or transactions array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let inserted = 0;
    let skipped = 0;
    const newTransactions: Array<{ name: string; amount: number }> = [];

    for (const tx of transactions) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user_id)
        .eq('external_id', tx.external_id || tx.id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from('transactions').insert({
        user_id,
        external_id: tx.external_id || tx.id,
        name: tx.name || tx.counterpart_name || 'Unknown',
        category: tx.category || 'Other',
        amount: tx.amount,
        currency: tx.currency || 'EUR',
        date: tx.date,
        icon: tx.icon || 'ArrowLeftRight',
        counterpart_name: tx.counterpart_name,
        counterpart_iban: tx.counterpart_iban,
        booking_text: tx.booking_text,
        synced_at: new Date().toISOString(),
      });

      if (error) {
        skipped++;
      } else {
        inserted++;
        newTransactions.push({ name: tx.name || tx.counterpart_name || 'Unknown', amount: tx.amount });
      }
    }

    // Send push notification for new transactions
    if (newTransactions.length > 0) {
      try {
        const totalAmount = newTransactions.reduce((s, t) => s + t.amount, 0);
        const title = newTransactions.length === 1
          ? `Neue Transaktion: ${newTransactions[0].name}`
          : `${newTransactions.length} neue Transaktionen`;
        const body = newTransactions.length === 1
          ? `${newTransactions[0].amount > 0 ? '+' : ''}${newTransactions[0].amount.toFixed(2)} €`
          : `Gesamt: ${totalAmount > 0 ? '+' : ''}${totalAmount.toFixed(2)} €`;

        await supabase.functions.invoke('send-push-notification', {
          body: JSON.stringify({ user_id, title, body }),
        });
      } catch (pushErr) {
        console.error('Push notification failed (non-critical):', pushErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      inserted,
      skipped,
      total: transactions.length,
      notified: newTransactions.length > 0,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
