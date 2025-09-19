
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InitializeCourses } from "@/components/InitializeCourses";
import { FloatingChatBubble } from "@/components/FloatingChatBubble";
import { NavigationPersistence } from "@/components/NavigationPersistence";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Community from "./pages/Community";
import Friends from "./pages/Friends";
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
import ChatTest from "./pages/ChatTest";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/community" element={<Community />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/ai-chat" element={<AiChat />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/placement-test" element={<PlacementTest />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:courseId" element={<Course />} />
            <Route path="/level-test/:fromLevel/:toLevel" element={<LevelTest />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/chat-test" element={<ChatTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
