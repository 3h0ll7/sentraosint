import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headline, description } = await req.json();
    if (!headline) throw new Error("headline is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an OSINT event classifier. Classify the given news headline into exactly one category and assess severity. You MUST respond using the classify_event tool.`,
          },
          {
            role: "user",
            content: `Headline: ${headline}\n${description ? `Details: ${description}` : ""}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_event",
              description: "Classify a news event into a category with severity and location",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", enum: ["military", "economy", "trade", "health", "disaster", "political"] },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  country: { type: "string", description: "Primary country affected (ISO name)" },
                  lat: { type: "number", description: "Approximate latitude of the event" },
                  lng: { type: "number", description: "Approximate longitude of the event" },
                  summary: { type: "string", description: "One-sentence summary" },
                },
                required: ["category", "severity", "country", "lat", "lng", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_event" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const classification = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-event error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
