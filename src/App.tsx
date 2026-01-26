import React, { Suspense, lazy } from "react";
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
import MobileInstallPrompt from "@/components/MobileInstallPrompt";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (heavy or less frequently accessed)
const Community = lazy(() => import("./pages/Community"));
const Friends = lazy(() => import("./pages/Friends"));
const Messages = lazy(() => import("./pages/Messages"));
const Settings = lazy(() => import("./pages/Settings"));
const AiChat = lazy(() => import("./pages/AiChat"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const ConhecerCursos = lazy(() => import("./pages/ConhecerCursos"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PlacementTest = lazy(() => import("./pages/PlacementTest"));
const Course = lazy(() => import("./pages/Course"));
const LevelTest = lazy(() => import("./pages/LevelTest"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ChatTest = lazy(() => import("./pages/ChatTest"));
const Profile = lazy(() => import("./pages/Profile"));
const CourseManagement = lazy(() => import("./pages/CourseManagement"));
const ClickHangout = lazy(() => import("./pages/ClickHangout"));
const AdminPaymentHistory = lazy(() => import("./pages/AdminPaymentHistory"));
const EnemTutor = lazy(() => import("./pages/EnemTutor"));
const EnemCourse = lazy(() => import("./pages/EnemCourse"));
const EnemLesson = lazy(() => import("./pages/EnemLesson"));
const EnemExam = lazy(() => import("./pages/EnemExam"));
const ClickOfTheWeek = lazy(() => import("./pages/ClickOfTheWeek"));
const MascotPreview = lazy(() => import("./pages/MascotPreview"));
const PixelMascotPreview = lazy(() => import("./pages/PixelMascotPreview"));
const MascotComparison = lazy(() => import("./pages/MascotComparison"));
const Install = lazy(() => import("./pages/Install"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

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
                <MobileInstallPrompt />
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/install" element={<Install />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
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
