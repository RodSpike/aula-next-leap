import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedComprehensiveCourseData } from "@/utils/comprehensiveSeedData";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

export function SeedComprehensiveDataButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      await seedComprehensiveCourseData();
      toast({
        title: "Success!",
        description: "Comprehensive course content has been created successfully!",
      });
    } catch (error) {
      console.error('Error seeding comprehensive data:', error);
      toast({
        title: "Error",
        description: "Failed to create comprehensive course content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeedData}
      disabled={isLoading}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating Content...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          <BookOpen className="w-4 h-4 mr-2" />
          Create Comprehensive Course Content
        </>
      )}
    </Button>
  );
}