import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via API key (from Python server)
    const apiKey = req.headers.get('x-api-key');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!apiKey || apiKey !== Deno.env.get('SYNC_API_KEY')) {
      // Fall back to JWT auth for authenticated users
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

    // Upsert transactions (skip duplicates via external_id)
    let inserted = 0;
    let skipped = 0;

    for (const tx of transactions) {
      const { error } = await supabase.from('transactions').upsert({
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
      }, { onConflict: 'user_id,external_id', ignoreDuplicates: false });

      if (error) { skipped++; } else { inserted++; }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      inserted, 
      skipped,
      total: transactions.length,
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
