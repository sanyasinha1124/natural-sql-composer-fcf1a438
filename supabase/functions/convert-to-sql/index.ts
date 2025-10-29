import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Converting natural language to SQL:", query);

    const systemPrompt = `You are an expert SQL query generator. Convert natural language questions into valid SQL queries.

Context: You're working with a sample e-commerce database with these tables:

**customers** (id, name, email, country, created_at)
**products** (id, name, category, price, stock_quantity)
**orders** (id, customer_id, order_date, total_amount, status)
**order_items** (id, order_id, product_id, quantity, unit_price)

Rules:
- Generate ONLY the SQL query, no explanations
- Use proper SQL syntax (PostgreSQL)
- Include relevant JOINs when needed
- Use appropriate WHERE clauses for filtering
- Add ORDER BY and LIMIT when sensible
- Return well-formatted, readable SQL with proper indentation
- Always use table aliases for clarity`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const sqlQuery = data.choices[0].message.content;

    console.log("Generated SQL:", sqlQuery);

    return new Response(
      JSON.stringify({ sql: sqlQuery }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in convert-to-sql function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
