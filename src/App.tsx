import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { initPushNotifications } from "@/lib/pushNotifications";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import Chat from "./pages/Chat";
import ChatDetail from "./pages/ChatDetail";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import WalletPage from "./pages/WalletPage";
import ReceiveCrypto from "./pages/ReceiveCrypto";
import AllTransactions from "./pages/AllTransactions";
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
  const navigate = useNavigate();
  const location = useLocation();
  const isNativeIos = Capacitor.getPlatform() === 'ios';

  const postRouteChange = (path: string) => {
    try {
      (window as any).webkit?.messageHandlers?.routeChange?.postMessage(path);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      initPushNotifications();
    }

    const targetPath = user ? location.pathname : '/auth';
    postRouteChange(targetPath);

    if (!isNativeIos) return;

    const retries = [150, 500, 1200].map((delay) =>
      window.setTimeout(() => postRouteChange(targetPath), delay)
    );

    return () => {
      retries.forEach(window.clearTimeout);
    };
  }, [user, location.pathname, isNativeIos]);

  useEffect(() => {
    const handler = (e: Event) => {
      const route = (e as CustomEvent).detail;
      if (!route) return;
      navigate(route);
      postRouteChange(route);
    };
    window.addEventListener('nativeTabChange', handler);
    return () => window.removeEventListener('nativeTabChange', handler);
  }, [navigate]);

  useEffect(() => {
    postRouteChange(location.pathname);
  }, [location.pathname]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-beige border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="max-w-md mx-auto relative h-full overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/receive" element={<ReceiveCrypto />} />
          <Route path="/transactions" element={<ProtectedRoute><AllTransactions /></ProtectedRoute>} />
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
