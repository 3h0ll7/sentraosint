import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google News RSS topic feeds - no API key needed
const NEWS_TOPICS = [
  { query: "military+conflict+war", category: "military" },
  { query: "economy+sanctions+recession", category: "economy" },
  { query: "trade+tariff+shipping", category: "trade" },
  { query: "pandemic+disease+outbreak", category: "health" },
  { query: "political+crisis+election+coup", category: "political" },
];

function parseRSSItems(xml: string): { title: string; link: string; pubDate: string; source: string }[] {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "Google News";

    if (title && !title.includes("Google News")) {
      items.push({ title, link, pubDate, source });
    }
  }
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const allArticles: { title: string; link: string; pubDate: string; source: string; queryCategory: string }[] = [];

    // Fetch RSS feeds sequentially with delays
    for (let i = 0; i < NEWS_TOPICS.length; i++) {
      const topic = NEWS_TOPICS[i];
      if (i > 0) await new Promise(r => setTimeout(r, 1000));

      try {
        const rssUrl = `https://news.google.com/rss/search?q=${topic.query}&hl=en&gl=US&ceid=US:en`;
        console.log(`Fetching Google News [${topic.category}]`);

        const res = await fetch(rssUrl, {
          headers: { "User-Agent": "Mozilla/5.0 OSINT Feed Reader" },
        });

        if (!res.ok) {
          console.warn(`Google News ${topic.category} error: ${res.status}`);
          continue;
        }

        const xml = await res.text();
        const items = parseRSSItems(xml).slice(0, 3);
        items.forEach(item => {
          allArticles.push({ ...item, queryCategory: topic.category });
        });
      } catch (e) {
        console.warn(`Google News ${topic.category} failed:`, e);
      }
    }

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({ news: 0, message: "No articles from Google News" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const classifiedEvents: any[] = [];

    // AI classification
    if (LOVABLE_API_KEY && allArticles.length > 0) {
      const batchPrompt = allArticles.map((a, idx) => `[${idx}] "${a.title}"`).join("\n");

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
          const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          const classifications = JSON.parse(jsonStr);

          for (const cls of classifications) {
            const article = allArticles[cls.index];
            if (!article) continue;
            classifiedEvents.push({
              category: cls.category || article.queryCategory,
              severity: cls.severity || "medium",
              title: article.title,
              description: cls.summary || null,
              source: `GNews/${article.source}`,
              country: cls.country || null,
              lat: cls.lat || null,
              lng: cls.lng || null,
              url: article.link,
              is_breaking: cls.is_breaking || false,
              raw_data: { source: article.source, pubDate: article.pubDate },
            });
          }
        } else {
          console.warn("AI classification failed:", aiRes.status);
        }
      } catch (aiErr) {
        console.warn("AI classification error:", aiErr);
      }
    }

    // Fallback without AI
    if (classifiedEvents.length === 0) {
      for (const article of allArticles) {
        classifiedEvents.push({
          category: article.queryCategory,
          severity: "medium",
          title: article.title,
          description: null,
          source: `GNews/${article.source}`,
          country: null,
          lat: null,
          lng: null,
          url: article.link,
          is_breaking: false,
          raw_data: { source: article.source, pubDate: article.pubDate },
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

    // Delete old Google News events and insert fresh
    await supabase.from("global_events").delete().like("source", "GNews/%");
    if (unique.length > 0) {
      const { error } = await supabase.from("global_events").insert(unique);
      if (error) throw error;
    }

    console.log(`Google News: ${unique.length} events classified and stored`);

    return new Response(JSON.stringify({ news: unique.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-google-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
