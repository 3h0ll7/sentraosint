import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional bounding box from request body
    let lamin = -90, lomin = -180, lamax = 90, lomax = 180;
    try {
      const body = await req.json();
      if (body.lamin) lamin = body.lamin;
      if (body.lomin) lomin = body.lomin;
      if (body.lamax) lamax = body.lamax;
      if (body.lomax) lomax = body.lomax;
    } catch { /* no body, use global bounds */ }

    // OpenSky Network REST API — free, no API key needed
    // Limit to a region to avoid huge payloads; default to Middle East / Mediterranean region
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    console.log("Fetching OpenSky:", url);

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenSky API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const states = data.states || [];

    // OpenSky state vector fields:
    // 0: icao24, 1: callsign, 2: origin_country, 3: time_position,
    // 4: last_contact, 5: longitude, 6: latitude, 7: baro_altitude,
    // 8: on_ground, 9: velocity, 10: true_track, 11: vertical_rate,
    // 12: sensors, 13: geo_altitude, 14: squawk, 15: spi, 16: position_source

    const entities = states
      .filter((s: any[]) => s[5] != null && s[6] != null && !s[8]) // has coords, not on ground
      .slice(0, 200) // limit to 200 aircraft
      .map((s: any[]) => {
        const icao = s[0] as string;
        const callsign = (s[1] as string)?.trim() || null;
        const country = s[2] as string;
        const lng = s[5] as number;
        const lat = s[6] as number;
        const altitude = s[7] != null ? Math.round((s[7] as number) * 3.28084) : null; // meters to feet
        const speed = s[9] != null ? Math.round((s[9] as number) * 1.94384) : null; // m/s to knots
        const heading = s[10] as number | null;

        // Classify based on callsign patterns
        let classification: "military" | "civilian" | "unknown" = "civilian";
        if (callsign) {
          const cs = callsign.toUpperCase();
          // Common military prefixes
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
          lat,
          lng,
          heading,
          speed,
          altitude,
          source: "OpenSky Network",
          details: `Origin: ${country}. Real-time ADS-B tracking.`,
          country,
          flag_code: null,
          threat_score: classification === "military" ? 40 : classification === "unknown" ? 25 : 0,
          origin: country,
          updated_at: new Date().toISOString(),
        };
      });

    // Delete old OpenSky entities and insert fresh
    await supabase.from("entities").delete().like("id", "opensky-%");
    if (entities.length > 0) {
      const { error } = await supabase.from("entities").upsert(entities, { onConflict: "id" });
      if (error) throw error;
    }

    // Also insert trail points for these aircraft
    const trailRows = entities.map((e: any) => ({
      entity_id: e.id,
      lat: e.lat,
      lng: e.lng,
    }));
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
