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

    // GDACS provides a GeoJSON feed of current disaster alerts
    const gdacsUrl = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Green;Orange;Red&eventlist=EQ;TC;FL;VO;DR;WF&fromDate=" +
      new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0] +
      "&toDate=" + new Date().toISOString().split("T")[0] +
      "&limit=50";

    console.log("Fetching GDACS:", gdacsUrl);

    const res = await fetch(gdacsUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GDACS API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const features = data.features || [];

    const events = features
      .filter((f: any) => f.geometry?.coordinates)
      .slice(0, 50)
      .map((f: any) => {
        const props = f.properties || {};
        const [lng, lat] = f.geometry.coordinates;

        // Map GDACS alert level to our severity
        let severity: string;
        const alertLevel = (props.alertlevel || "").toLowerCase();
        if (alertLevel === "red") severity = "critical";
        else if (alertLevel === "orange") severity = "high";
        else severity = "medium";

        // Map event type
        const eventType = (props.eventtype || "").toUpperCase();
        let category = "disaster";
        const typeLabel =
          eventType === "EQ" ? "Earthquake" :
          eventType === "TC" ? "Tropical Cyclone" :
          eventType === "FL" ? "Flood" :
          eventType === "VO" ? "Volcanic Activity" :
          eventType === "DR" ? "Drought" :
          eventType === "WF" ? "Wildfire" :
          "Disaster";

        return {
          category,
          severity,
          title: `${typeLabel} — ${props.name || props.country || "Unknown"}`,
          description: props.description || `${typeLabel} alert (${alertLevel.toUpperCase()}) reported by GDACS. Population affected: ${props.population?.value || "unknown"}`,
          source: "GDACS",
          country: props.country || null,
          lat,
          lng,
          url: props.url || `https://www.gdacs.org/report.aspx?eventid=${props.eventid}&episodeid=${props.episodeid}`,
          raw_data: { eventtype: eventType, alertlevel: alertLevel, eventid: props.eventid, severity: props.severity },
          is_breaking: alertLevel === "red",
        };
      });

    // Delete old GDACS events and insert fresh
    await supabase.from("global_events").delete().eq("source", "GDACS");
    if (events.length > 0) {
      const { error } = await supabase.from("global_events").insert(events);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ alerts: events.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-gdacs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
