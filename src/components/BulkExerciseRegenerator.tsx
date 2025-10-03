import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";

export const BulkExerciseRegenerator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { toast } = useToast();

  const run = async () => {
    if (!confirm("This will regenerate exercises for ALL lessons. Continue?")) return;
    setIsRunning(true);
    setResult(null);

    try {
      toast({ title: "Starting", description: "Generating exercises for all lessons..." });
      const { data, error } = await supabase.functions.invoke("bulk-generate-practice-exercises", { body: {} });
      if (error) throw error;
      setResult(data);
      toast({ title: "Completed", description: `Processed ${data.processed}. Successes: ${data.successes}, Failures: ${data.failures}` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to run bulk generation", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-background/50 border">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-1">
            <div className="font-semibold">Generate Exercises with AI (All Lessons)</div>
            <p className="text-sm text-muted-foreground">Regenerates exercises for every lesson across all courses using the latest AI prompts.</p>
          </div>
          <Button onClick={run} disabled={isRunning} className="gap-2">
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} 
            {isRunning ? "Running..." : "Regenerate All"}
          </Button>
        </div>
        {result && (
          <div className="border-t p-4 text-sm text-muted-foreground">
            Processed: {result.processed} • Successes: {result.successes} • Failures: {result.failures}
          </div>
        )}
      </CardContent>
    </Card>
  );
};