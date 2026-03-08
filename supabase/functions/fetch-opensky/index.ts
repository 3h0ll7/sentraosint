import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (res.status === 429) {
      if (attempt < maxRetries) {
        const delay = (attempt + 1) * 5000; // 5s, 10s
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      // All retries exhausted — return cached data instead
      return res;
    }
    return res;
  }
  throw new Error("Unreachable");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let lamin = 10, lomin = 25, lamax = 55, lomax = 75;
    try {
      const body = await req.json();
      if (body.lamin != null) lamin = body.lamin;
      if (body.lomin != null) lomin = body.lomin;
      if (body.lamax != null) lamax = body.lamax;
      if (body.lomax != null) lomax = body.lomax;
    } catch { /* use defaults */ }

    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    console.log("Fetching OpenSky:", url);

    const res = await fetchWithRetry(url);

    // If still rate-limited after retries, return existing cached data count
    if (res.status === 429) {
      await res.text(); // consume body
      const { count } = await supabase.from("entities").select("id", { count: "exact", head: true }).like("id", "opensky-%");
      console.log("Rate limited — serving cached data, count:", count);
      return new Response(JSON.stringify({ tracked: count ?? 0, cached: true, message: "Rate limited — using cached data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenSky API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const states = data.states || [];

    const entities = states
      .filter((s: any[]) => s[5] != null && s[6] != null && !s[8])
      .slice(0, 200)
      .map((s: any[]) => {
        const icao = s[0] as string;
        const callsign = (s[1] as string)?.trim() || null;
        const country = s[2] as string;
        const lng = s[5] as number;
        const lat = s[6] as number;
        const altitude = s[7] != null ? Math.round((s[7] as number) * 3.28084) : null;
        const speed = s[9] != null ? Math.round((s[9] as number) * 1.94384) : null;
        const heading = s[10] as number | null;

        let classification: "military" | "civilian" | "unknown" = "civilian";
        if (callsign) {
          const cs = callsign.toUpperCase();
          if (/^(RCH|DUKE|EVAC|REACH|JAKE|VALOR|CSAR|BOLT|VIPER|COBRA|HAWK|EAGLE|FURY|BLADE|STEEL|IRON|TEAL|NATO|RRR|NAVY|AIR[FM]|BAF|GAF|FAF|IAF|RAF|PAF|USAF|RFR|CFC|MAC|AMC)/.test(cs)) {
            classification = "military";
          }
        } else {
          classification = "unknown";
        }

        return {
          id: `opensky-${icao}`,
          type: "aircraft" as const,
          classification,
          name: callsign || `ICAO:${icao.toUpperCase()}`,
          callsign,
          lat, lng, heading, speed, altitude,
          source: "OpenSky Network",
          details: `Origin: ${country}. Real-time ADS-B tracking.`,
          country,
          flag_code: null,
          threat_score: classification === "military" ? 40 : classification === "unknown" ? 25 : 0,
          origin: country,
          updated_at: new Date().toISOString(),
        };
      });

    // Delete old and insert fresh
    await supabase.from("entities").delete().like("id", "opensky-%");
    if (entities.length > 0) {
      const { error } = await supabase.from("entities").upsert(entities, { onConflict: "id" });
      if (error) throw error;
    }

    const trailRows = entities.map((e: any) => ({ entity_id: e.id, lat: e.lat, lng: e.lng }));
    if (trailRows.length > 0) {
      await supabase.from("trail_points").insert(trailRows);
    }

    return new Response(JSON.stringify({ tracked: entities.length, timestamp: data.time }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-opensky error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
