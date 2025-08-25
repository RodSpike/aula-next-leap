import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { seedCourseData } from "@/utils/seedData";
import { Database, Loader2 } from "lucide-react";

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedCourseData();
      if (result.success) {
        toast({
          title: "Success!",
          description: "Course data has been seeded successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed course data.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button 
      onClick={handleSeedData} 
      disabled={isSeeding}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      {isSeeding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      <span>{isSeeding ? "Seeding..." : "Seed Course Data"}</span>
    </Button>
  );
}