import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar, User, BookOpen } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [birthdate, setBirthdate] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user already completed onboarding
    const checkProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('birthdate, cambridge_level')
        .eq('user_id', user.id)
        .single();

      if (data?.birthdate && data?.cambridge_level) {
        navigate("/");
      }
    };

    checkProfile();
  }, [user, navigate]);

  const handleProfileUpdate = async () => {
    if (!birthdate || !displayName) {
      toast({
        title: "Please fill all fields",
        description: "Both display name and birthdate are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          birthdate: birthdate
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setStep(2);
      toast({
        title: "Profile updated!",
        description: "Now let's determine your English level",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo à Aula Click!</CardTitle>
            <CardDescription>Vamos configurar seu perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of Birth</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleProfileUpdate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Ready for Your Placement Test?</CardTitle>
          <CardDescription>
            Let's determine your English proficiency level to provide you with the best learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">What you'll get:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personalized learning recommendations</li>
                <li>• Access to appropriate community groups</li>
                <li>• Tailored AI tutoring sessions</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/placement-test")} className="flex-1">
              Take Placement Test
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              variant="outline" 
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;