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

    // NASA FIRMS provides a free open CSV feed for active fires (last 24h)
    // Using MODIS C6.1 NRT data — no API key required for the open CSV
    const firmsUrl = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv";
    console.log("Fetching NASA FIRMS active fire data...");

    const res = await fetch(firmsUrl);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FIRMS API error ${res.status}: ${text}`);
    }

    const csvText = await res.text();
    const lines = csvText.split("\n").filter(l => l.trim());
    const headers = lines[0].split(",");

    // Parse CSV — take a sample of high-confidence fires
    const latIdx = headers.indexOf("latitude");
    const lngIdx = headers.indexOf("longitude");
    const brightIdx = headers.indexOf("brightness");
    const confIdx = headers.indexOf("confidence");
    const dateIdx = headers.indexOf("acq_date");
    const timeIdx = headers.indexOf("acq_time");
    const frpIdx = headers.indexOf("frp");

    const fires = lines.slice(1)
      .map(line => {
        const cols = line.split(",");
        return {
          lat: parseFloat(cols[latIdx]),
          lng: parseFloat(cols[lngIdx]),
          brightness: parseFloat(cols[brightIdx]),
          confidence: parseInt(cols[confIdx]) || 0,
          date: cols[dateIdx],
          time: cols[timeIdx],
          frp: parseFloat(cols[frpIdx]) || 0,
        };
      })
      .filter(f => !isNaN(f.lat) && !isNaN(f.lng) && f.confidence >= 80)  // high confidence only
      .sort((a, b) => b.frp - a.frp)  // sort by fire radiative power
      .slice(0, 80);  // top 80 fires globally

    const events = fires.map(f => {
      let severity: string;
      if (f.frp >= 500) severity = "critical";
      else if (f.frp >= 200) severity = "high";
      else if (f.frp >= 50) severity = "medium";
      else severity = "low";

      return {
        category: "disaster" as const,
        severity,
        title: `Active Wildfire — ${f.lat.toFixed(2)}°, ${f.lng.toFixed(2)}°`,
        description: `Fire radiative power: ${f.frp.toFixed(0)} MW. Brightness: ${f.brightness.toFixed(0)}K. Confidence: ${f.confidence}%. Detected: ${f.date} ${f.time}`,
        source: "NASA FIRMS",
        country: null,
        lat: f.lat,
        lng: f.lng,
        url: "https://firms.modaps.eosdis.nasa.gov/map/",
        raw_data: f,
        is_breaking: f.frp >= 300,
      };
    });

    // Delete old FIRMS events and insert fresh
    await supabase.from("global_events").delete().eq("source", "NASA FIRMS");
    if (events.length > 0) {
      const { error } = await supabase.from("global_events").insert(events);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ fires_tracked: events.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-firms error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
