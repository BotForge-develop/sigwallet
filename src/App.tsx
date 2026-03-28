import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { initPushNotifications } from "@/lib/pushNotifications";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import Chat from "./pages/Chat";
import ChatDetail from "./pages/ChatDetail";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import WalletPage from "./pages/WalletPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-beige border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      initPushNotifications();
    }
  }, [user]);
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-beige border-t-transparent animate-spin" />
    </div>
  );

  return (
      <div className="fixed inset-0 overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-liquid-surface" />
          <div className="absolute left-[-12%] top-[-8%] h-64 w-64 rounded-full bg-liquid-highlight blur-3xl" />
          <div className="absolute bottom-[12%] right-[-10%] h-72 w-72 rounded-full bg-liquid-shadow blur-3xl" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-3xl" />
        </div>
        <div className="max-w-md mx-auto relative h-full overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:contactId" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {user && <BottomNav />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
