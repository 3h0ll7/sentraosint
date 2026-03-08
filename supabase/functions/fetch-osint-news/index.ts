import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  seendate: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Single combined GDELT query to avoid rate limiting
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent("military OR conflict OR war OR economy OR sanctions OR trade OR tariff OR pandemic OR health OR political OR crisis")}&mode=artlist&maxrecords=15&format=json&sort=DateDesc&timespan=24h`;
    console.log("Fetching GDELT combined:", gdeltUrl);

    const res = await fetch(gdeltUrl);
    if (!res.ok) {
      const body = await res.text();
      console.warn(`GDELT error: ${res.status}`, body.slice(0, 200));
      // Return cached count
      const { count } = await supabase.from("global_events").select("id", { count: "exact", head: true }).like("source", "GDELT/%");
      return new Response(JSON.stringify({ news: count ?? 0, cached: true, message: "GDELT rate limited — using cached data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const articles: GdeltArticle[] = (data.articles || []).slice(0, 15);

    if (articles.length === 0) {
      return new Response(JSON.stringify({ news: 0, message: "No articles from GDELT" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to classify all articles in one batch
    const classifiedEvents: any[] = [];

    if (LOVABLE_API_KEY) {
      const batchPrompt = articles.map((a, idx) => `[${idx}] "${a.title}"`).join("\n");

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You are an OSINT news classifier. For each headline, output a JSON array where each element has:
- index (number)
- category: one of "military","economy","trade","health","disaster","political"
- severity: one of "critical","high","medium","low"
- country: primary country name or null
- lat: approximate latitude or null
- lng: approximate longitude or null
- summary: one short sentence summary
- is_breaking: boolean (true only for major global events)
Respond ONLY with the JSON array, no markdown.`,
              },
              { role: "user", content: batchPrompt },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          const classifications = JSON.parse(jsonMatch);

          for (const cls of classifications) {
            const article = articles[cls.index];
            if (!article) continue;
            classifiedEvents.push({
              category: cls.category || "political",
              severity: cls.severity || "medium",
              title: article.title,
              description: cls.summary || null,
              source: `GDELT/${article.domain}`,
              country: cls.country || null,
              lat: cls.lat || null,
              lng: cls.lng || null,
              url: article.url,
              is_breaking: cls.is_breaking || false,
              raw_data: { domain: article.domain, seendate: article.seendate },
            });
          }
        } else {
          console.warn("AI classification failed:", aiRes.status);
        }
      } catch (aiErr) {
        console.warn("AI classification error:", aiErr);
      }
    }

    // Fallback: if AI didn't classify any, use articles directly
    if (classifiedEvents.length === 0) {
      for (const article of articles) {
        classifiedEvents.push({
          category: "political",
          severity: "medium",
          title: article.title,
          description: null,
          source: `GDELT/${article.domain}`,
          country: null,
          lat: null,
          lng: null,
          url: article.url,
          is_breaking: false,
          raw_data: { domain: article.domain, seendate: article.seendate },
        });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = classifiedEvents.filter(e => {
      const key = e.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Delete old and insert fresh
    await supabase.from("global_events").delete().like("source", "GDELT/%");
    if (unique.length > 0) {
      const { error } = await supabase.from("global_events").insert(unique);
      if (error) throw error;
    }

    console.log(`GDELT news: ${unique.length} events classified and stored`);

    return new Response(JSON.stringify({ news: unique.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-osint-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
