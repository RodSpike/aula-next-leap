import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function InitializeCourses() {
  const { user } = useAuth();

  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        try {
          // Check if courses exist in database
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .limit(1);
          
          if (coursesError) {
            console.error('Error checking courses:', coursesError);
            return;
          }

          // If no courses exist, populate the data
          if (!courses || courses.length === 0) {
            console.log('No courses found, populating learning content...');
            const { data, error } = await supabase.functions.invoke('populate-learning-content', {});
            
            if (error) {
              console.error('Error populating learning content:', error);
            } else {
              console.log('Learning content populated successfully:', data);
              localStorage.setItem('course-data-seeded', 'true');
            }
          }
        } catch (error) {
          console.error('Error initializing course data:', error);
        }
      }
    };

    initializeData();
  }, [user]);

  return null; // This component doesn't render anything
}