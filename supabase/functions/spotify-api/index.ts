import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID")?.trim();
  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID missing in Edge Function secrets");
  }
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  if (clientSecret) {
    params.set("client_secret", clientSecret);
  }
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { path } = (await req.json()) as { path: string };
    if (!path || !path.startsWith("/")) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cred, error: credErr } = await supabase
      .from("spotify_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (credErr || !cred?.refresh_token) {
      return new Response(JSON.stringify({ error: "Spotify not linked" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token } = await refreshAccessToken(cred.refresh_token);
    const url = `https://api.spotify.com${path.startsWith("/v1") ? path : `/v1${path}`}`;
    const spotifyRes = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const text = await spotifyRes.text();
    return new Response(text, {
      status: spotifyRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": spotifyRes.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
