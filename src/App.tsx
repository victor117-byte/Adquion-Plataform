import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Main from "./pages/Main";
import Onboarding from "./pages/Onboarding";
import BillingRedirect from "./pages/BillingRedirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente que sincroniza las preferencias de tema con el servidor
const ThemeSync = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { loadPreferencesFromServer } = useTheme();
  const userId = user?.userId;

  useEffect(() => {
    if (userId) {
      loadPreferencesFromServer();
    }
  }, [userId, loadPreferencesFromServer]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultColorTheme="default" defaultAppearanceMode="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeSync>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/main" element={<Main />} />
                {/* Redirección desde Stripe Checkout */}
                <Route path="/dashboard/billing" element={<BillingRedirect />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeSync>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
