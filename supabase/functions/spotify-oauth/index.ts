import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Body = {
  code: string;
  redirect_uri: string;
  code_verifier: string;
};

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

    const { code, redirect_uri, code_verifier } = (await req.json()) as Body;
    if (!code || !redirect_uri || !code_verifier) {
      return new Response(JSON.stringify({ error: "Missing OAuth fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID")?.trim();
    if (!clientId) {
      return new Response(
        JSON.stringify({
          error:
            "En Supabase falta el secret SPOTIFY_CLIENT_ID para Edge Functions. Ve a Project Settings → Edge Functions → Secrets, añade SPOTIFY_CLIENT_ID con el mismo valor que VITE_SPOTIFY_CLIENT_ID en tu .env (es el Client ID de Spotify, no el Client Secret).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PKCE (public client): never send client_secret — Spotify rejects the exchange if mixed with code_verifier.
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      client_id: clientId,
      code_verifier,
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Spotify token error", errText);
      let detail = errText.slice(0, 500);
      try {
        const j = JSON.parse(errText) as {
          error?: string;
          error_description?: string;
        };
        detail = [j.error, j.error_description].filter(Boolean).join(": ") || detail;
      } catch {
        /* keep raw */
      }
      return new Response(
        JSON.stringify({
          error:
            "Spotify rechazó el intercambio del código. " +
            "Comprueba que Redirect URI en Spotify coincide exactamente con la de la app, " +
            "que el Client ID en Supabase Secrets es el mismo que en .env, y que no reutilizas un código viejo. " +
            `Detalle: ${detail}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokenJson.refresh_token) {
      return new Response(
        JSON.stringify({
          error:
            "Spotify no devolvió refresh_token. Cierra sesión en Spotify (spotify.com/account/apps), revoca Moodify y vuelve a conectar; o asegúrate de que la app pide autorización completa la primera vez.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      console.error("Spotify /v1/me error", profileRes.status, errBody);
      let detail = errBody.slice(0, 400);
      try {
        const j = JSON.parse(errBody) as {
          error?: { message?: string } | string;
        };
        if (typeof j.error === "object" && j.error?.message) {
          detail = j.error.message;
        } else if (typeof j.error === "string") {
          detail = j.error;
        }
      } catch {
        /* keep */
      }
      return new Response(
        JSON.stringify({
          error:
            `Spotify no pudo leer tu perfil (HTTP ${profileRes.status}). ` +
            `Si la app Spotify está en modo desarrollo, añade tu cuenta en el Dashboard como usuario de prueba. ` +
            `Revoca Moodify en spotify.com/account/apps y vuelve a conectar para aceptar los permisos nuevos. ` +
            `Detalle: ${detail}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const me = (await profileRes.json()) as {
      id: string;
      display_name: string | null;
      email?: string;
      images?: { url: string }[];
    };

    const { error: credErr } = await supabase.from("spotify_credentials").upsert(
      {
        user_id: user.id,
        refresh_token: tokenJson.refresh_token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (credErr) {
      console.error(credErr);
      return new Response(
        JSON.stringify({
          error:
            "No se pudo guardar en la base de datos (spotify_credentials). " +
            "¿Ejecutaste la migración SQL en Supabase (tabla spotify_credentials)? " +
            `Detalle técnico: ${credErr.message} (${credErr.code ?? "sin código"})`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        spotify_id: me.id,
        display_name: me.display_name ?? "Listener",
        email: me.email ?? null,
        avatar_url: me.images?.[0]?.url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (profErr) {
      console.error(profErr);
      return new Response(JSON.stringify({ error: "Could not update profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, spotify_id: me.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
