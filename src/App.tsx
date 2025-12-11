import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { InitializeCourses } from "@/components/InitializeCourses";

import { NavigationPersistence } from "@/components/NavigationPersistence";
import { FirstTimeUserExperience } from "@/components/FirstTimeUserExperience";
import { RealtimeNotificationsProvider } from "@/components/RealtimeNotificationsProvider";
import { ActivityTrackingProvider } from "@/components/ActivityTrackingProvider";
import { CelebrationProvider } from "@/contexts/CelebrationContext";
import { SoundPreferencesProvider } from "@/contexts/SoundPreferencesContext";
import { WelcomeBackProvider } from "@/contexts/WelcomeBackContext";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import ConhecerCursos from "./pages/ConhecerCursos";
import Community from "./pages/Community";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import AiChat from "./pages/AiChat";
import AdminPanel from "./pages/AdminPanel";
import AdminAnalytics from "./pages/AdminAnalytics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import PlacementTest from "./pages/PlacementTest";
import Course from "./pages/Course";
import LevelTest from "./pages/LevelTest";
import Certificates from "./pages/Certificates";
import NotFound from "./pages/NotFound";
import Achievements from "./pages/Achievements";
import ChatTest from "./pages/ChatTest";
import Subscribe from "./pages/Subscribe";
import Welcome from "./pages/Welcome";
import Profile from "./pages/Profile";
import CourseManagement from "./pages/CourseManagement";
import ClickHangout from "./pages/ClickHangout";
import AdminPaymentHistory from "./pages/AdminPaymentHistory";
import EnemTutor from "./pages/EnemTutor";
import EnemCourse from "./pages/EnemCourse";
import EnemLesson from "./pages/EnemLesson";
import EnemExam from "./pages/EnemExam";
import ClickOfTheWeek from "./pages/ClickOfTheWeek";
import MascotPreview from "./pages/MascotPreview";
import PixelMascotPreview from "./pages/PixelMascotPreview";
import MascotComparison from "./pages/MascotComparison";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SoundPreferencesProvider>
        <BrowserRouter>
          <AuthProvider>
          <NavigationPersistence />
          <InitializeCourses />
          <RealtimeNotificationsProvider />
          <ActivityTrackingProvider />
          <TooltipProvider>
            <CelebrationProvider>
              <WelcomeBackProvider>
                <Toaster />
                <Sonner />
                
                <FirstTimeUserExperience />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/conhecer-cursos" element={<ConhecerCursos />} />
                <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="/course-management" element={<ProtectedRoute><CourseManagement /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/placement-test" element={<ProtectedRoute><PlacementTest /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/course/:courseId" element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path="/level-test/:fromLevel/:toLevel" element={<ProtectedRoute><LevelTest /></ProtectedRoute>} />
                <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                <Route path="/chat-test" element={<ProtectedRoute><ChatTest /></ProtectedRoute>} />
                <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/hangout" element={<ProtectedRoute><ClickHangout /></ProtectedRoute>} />
                <Route path="/enem-tutor" element={<ProtectedRoute><EnemTutor /></ProtectedRoute>} />
                <Route path="/enem-course" element={<ProtectedRoute><EnemCourse /></ProtectedRoute>} />
                <Route path="/enem-lesson/:subjectId" element={<ProtectedRoute><EnemLesson /></ProtectedRoute>} />
                <Route path="/enem-exam/:subjectId" element={<ProtectedRoute><EnemExam /></ProtectedRoute>} />
                <Route path="/admin/payment-history" element={<ProtectedRoute><AdminPaymentHistory /></ProtectedRoute>} />
                <Route path="/click-of-the-week" element={<ProtectedRoute><ClickOfTheWeek /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/mascot-preview" element={<MascotPreview />} />
                <Route path="/pixel-mascot-preview" element={<PixelMascotPreview />} />
                <Route path="/mascot-comparison" element={<MascotComparison />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </WelcomeBackProvider>
            </CelebrationProvider>
          </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </SoundPreferencesProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
