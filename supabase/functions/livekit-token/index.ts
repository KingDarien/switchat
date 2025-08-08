
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.3";
// LiveKit server SDK (ESM for Deno)
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.3.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_WS_URL = Deno.env.get("LIVEKIT_WS_URL");

    if (!supabaseUrl || !serviceKey || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      console.error("Missing required environment variables for LiveKit token function");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Identify caller from Supabase JWT
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);

    if (userErr || !userData?.user) {
      console.error("Unauthorized request: could not resolve user", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roomId, asSpeaker = false } = await req.json();
    if (!roomId) {
      return new Response(JSON.stringify({ error: "roomId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Authorization: ensure user can view/join this room
    const { data: canView, error: viewErr } = await supabase.rpc("can_view_audio_room", {
      room_id_param: roomId,
      user_id_param: userId,
    });

    if (viewErr) {
      console.error("can_view_audio_room error:", viewErr);
      return new Response(JSON.stringify({ error: "Access check failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!canView) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get display metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", userId)
      .single();

    const displayName =
      profile?.display_name || profile?.username || userData.user.email || "Guest";

    // Build LiveKit token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: displayName,
    });

    // Minimal grants: allow joining this room, always subscribe; publish if requested
    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: !!asSpeaker,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return new Response(JSON.stringify({ token, wsUrl: LIVEKIT_WS_URL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("livekit-token error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
