import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Show all customers from USA",
  "Find total sales for each product category",
  "List top 5 customers by order value",
  "Show products with low stock (less than 10)",
  "Get orders placed in the last 30 days",
];

export const SqlConverter = () => {
  const [input, setInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!input.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setIsLoading(true);
    setSqlOutput("");

    try {
      const { data, error } = await supabase.functions.invoke("convert-to-sql", {
        body: { query: input },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast.error("Rate limit exceeded. Please wait a moment.");
        } else if (error.message.includes("402")) {
          toast.error("AI credits depleted. Please add credits.");
        } else {
          toast.error("Failed to convert query");
        }
        console.error("Error:", error);
        return;
      }

      setSqlOutput(data.sql);
      toast.success("Query converted successfully!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!sqlOutput) return;
    await navigator.clipboard.writeText(sqlOutput);
    setCopied(true);
    toast.success("SQL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          AI-Powered SQL Generator
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Natural Language to SQL
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Convert plain English questions into SQL queries instantly using AI
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 bg-card border-border shadow-elegant">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Your Question in English
            </label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Show all customers who ordered in the last month..."
              className="min-h-[200px] resize-none bg-background border-input focus:ring-2 focus:ring-primary transition-all"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleConvert}
            disabled={isLoading || !input.trim()}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Convert to SQL
              </>
            )}
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Try These Examples:
            </label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-full transition-all hover:scale-105"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-secondary text-secondary-foreground shadow-code">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Generated SQL Query</label>
            {sqlOutput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-secondary-foreground hover:text-accent"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          <div className="bg-card/10 rounded-lg p-4 min-h-[200px] border border-border/50">
            {sqlOutput ? (
              <pre className="text-sm font-mono text-secondary-foreground whitespace-pre-wrap break-words">
                {sqlOutput}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground/50">
                {isLoading ? "Generating SQL..." : "Your SQL query will appear here"}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          Sample Database Schema
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-primary">customers</div>
            <div className="text-muted-foreground space-y-1">
              <div>• id</div>
              <div>• name</div>
              <div>• email</div>
              <div>• country</div>
              <div>• created_at</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-primary">products</div>
            <div className="text-muted-foreground space-y-1">
              <div>• id</div>
              <div>• name</div>
              <div>• category</div>
              <div>• price</div>
              <div>• stock_quantity</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-primary">orders</div>
            <div className="text-muted-foreground space-y-1">
              <div>• id</div>
              <div>• customer_id</div>
              <div>• order_date</div>
              <div>• total_amount</div>
              <div>• status</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-primary">order_items</div>
            <div className="text-muted-foreground space-y-1">
              <div>• id</div>
              <div>• order_id</div>
              <div>• product_id</div>
              <div>• quantity</div>
              <div>• unit_price</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
