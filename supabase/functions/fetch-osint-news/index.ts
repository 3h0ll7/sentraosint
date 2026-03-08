import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// GDELT GKG (Global Knowledge Graph) queries for each category
const OSINT_QUERIES = [
  { query: "military conflict war troops missile", category: "military" },
  { query: "economy recession sanctions inflation market crash", category: "economy" },
  { query: "trade shipping supply chain embargo tariff", category: "trade" },
  { query: "pandemic outbreak virus WHO disease epidemic", category: "health" },
  { query: "coup protest election regime government political crisis", category: "political" },
];

interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  seendate: string;
  socialimage?: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const allArticles: { article: GdeltArticle; queryCategory: string }[] = [];

    // Fetch from GDELT DOC API for each category
    for (const q of OSINT_QUERIES) {
      try {
        const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q.query)}&mode=artlist&maxrecords=10&format=json&sort=DateDesc&timespan=24h`;
        console.log(`Fetching GDELT [${q.category}]:`, gdeltUrl);

        const res = await fetch(gdeltUrl);
        if (!res.ok) {
          console.warn(`GDELT ${q.category} error: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const articles: GdeltArticle[] = data.articles || [];
        articles.slice(0, 5).forEach(a => {
          allArticles.push({ article: a, queryCategory: q.category });
        });
      } catch (e) {
        console.warn(`GDELT ${q.category} fetch failed:`, e);
      }
    }

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({ news: 0, message: "No articles from GDELT" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to classify and extract location for each article (batch)
    const classifiedEvents: any[] = [];

    // Process in batches of 5 to avoid rate limits
    const batches = [];
    for (let i = 0; i < allArticles.length; i += 5) {
      batches.push(allArticles.slice(i, i + 5));
    }

    for (const batch of batches) {
      if (!LOVABLE_API_KEY) {
        // Fallback: use query category directly without AI classification
        for (const { article, queryCategory } of batch) {
          classifiedEvents.push({
            category: queryCategory,
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
        continue;
      }

      // AI classification for the batch
      const batchPrompt = batch.map(({ article }, idx) =>
        `[${idx}] "${article.title}"`
      ).join("\n");

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
- category: one of "military","economy","trade","health","political"
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
          // Parse JSON from response
          const jsonMatch = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          const classifications = JSON.parse(jsonMatch);

          for (const cls of classifications) {
            const item = batch[cls.index];
            if (!item) continue;
            classifiedEvents.push({
              category: cls.category || item.queryCategory,
              severity: cls.severity || "medium",
              title: item.article.title,
              description: cls.summary || null,
              source: `GDELT/${item.article.domain}`,
              country: cls.country || null,
              lat: cls.lat || null,
              lng: cls.lng || null,
              url: item.article.url,
              is_breaking: cls.is_breaking || false,
              raw_data: { domain: item.article.domain, seendate: item.article.seendate },
            });
          }
        } else {
          // Fallback on AI error
          for (const { article, queryCategory } of batch) {
            classifiedEvents.push({
              category: queryCategory,
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
      } catch (aiErr) {
        console.warn("AI classification failed:", aiErr);
        for (const { article, queryCategory } of batch) {
          classifiedEvents.push({
            category: queryCategory,
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

      // Small delay between batches
      if (batches.length > 1) await new Promise(r => setTimeout(r, 500));
    }

    // Deduplicate by title similarity (exact match)
    const seen = new Set<string>();
    const unique = classifiedEvents.filter(e => {
      const key = e.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Delete old GDELT news events and insert fresh
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
