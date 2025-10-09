import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InitializeCourses } from "@/components/InitializeCourses";
import { FloatingChatBubble } from "@/components/FloatingChatBubble";
import { NavigationPersistence } from "@/components/NavigationPersistence";
import { FirstTimeUserExperience } from "@/components/FirstTimeUserExperience";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Community from "./pages/Community";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import AiChat from "./pages/AiChat";
import AdminPanel from "./pages/AdminPanel";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NavigationPersistence />
        <InitializeCourses />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <FloatingChatBubble />
          <FirstTimeUserExperience />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/placement-test" element={<ProtectedRoute><PlacementTest /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/course/:courseId" element={<ProtectedRoute><Course /></ProtectedRoute>} />
            <Route path="/level-test/:fromLevel/:toLevel" element={<ProtectedRoute><LevelTest /></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/chat-test" element={<ProtectedRoute><ChatTest /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
