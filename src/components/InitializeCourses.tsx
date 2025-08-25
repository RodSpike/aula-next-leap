import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { seedCourseData } from "@/utils/seedData";

export function InitializeCourses() {
  const { user } = useAuth();

  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        try {
          // Check if we need to seed data (only once)
          const hasSeeded = localStorage.getItem('course-data-seeded');
          if (!hasSeeded) {
            await seedCourseData();
            localStorage.setItem('course-data-seeded', 'true');
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