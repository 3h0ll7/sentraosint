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

    // Fetch recent earthquakes from USGS (last 24h, M2.5+)
    const usgsUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";
    const res = await fetch(usgsUrl);
    if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
    const data = await res.json();

    const events = data.features.slice(0, 50).map((f: any) => {
      const props = f.properties;
      const [lng, lat] = f.geometry.coordinates;
      const mag = props.mag || 0;

      let severity: string;
      if (mag >= 7) severity = "critical";
      else if (mag >= 5.5) severity = "high";
      else if (mag >= 4) severity = "medium";
      else severity = "low";

      return {
        category: "disaster",
        severity,
        title: `M${mag.toFixed(1)} Earthquake — ${props.place || "Unknown"}`,
        description: `Magnitude ${mag.toFixed(1)} earthquake detected. Depth: ${f.geometry.coordinates[2]?.toFixed(1) || "?"}km. ${props.tsunami ? "⚠️ Tsunami warning issued." : ""}`,
        source: "USGS",
        country: props.place?.split(", ").pop() || "Unknown",
        lat,
        lng,
        url: props.url || null,
        raw_data: { mag, depth: f.geometry.coordinates[2], tsunami: props.tsunami, time: props.time },
        is_breaking: mag >= 6,
      };
    });

    // Upsert by deleting old USGS events and inserting fresh
    await supabase.from("global_events").delete().eq("source", "USGS");
    if (events.length > 0) {
      const { error } = await supabase.from("global_events").insert(events);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ inserted: events.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-earthquakes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
