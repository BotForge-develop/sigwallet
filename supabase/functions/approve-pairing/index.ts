import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user from the JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_token, device_name } = await req.json();

    // Check session exists and is pending
    const { data: session, error: fetchError } = await supabase
      .from("pairing_sessions")
      .select("*")
      .eq("session_token", session_token)
      .eq("status", "pending")
      .single();

    if (fetchError || !session) {
      return new Response(JSON.stringify({ error: "Session not found or expired" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase
        .from("pairing_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a new session for the desktop device
    const { data: { session: newSession }, error: signError } = await supabase.auth.admin.createSession({
      user_id: user.id,
    });

    if (signError || !newSession) {
      // Fallback: store user_id so desktop can use magic link or similar
      await supabase
        .from("pairing_sessions")
        .update({
          status: "approved",
          user_id: user.id,
          device_name: device_name || "Desktop",
        })
        .eq("id", session.id);

      return new Response(JSON.stringify({ success: true, method: "user_id_only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the tokens in the pairing session
    await supabase
      .from("pairing_sessions")
      .update({
        status: "approved",
        user_id: user.id,
        device_name: device_name || "Desktop",
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
      })
      .eq("id", session.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
