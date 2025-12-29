import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";

import { AdminLayout } from "./components/layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import Gamification from "./pages/dashboard/Gamification";
import Settings from "./pages/dashboard/Settings";
import Raffle from "./pages/dashboard/Raffle";
import LinkBio from "./pages/dashboard/LinkBio";
import WhatsAppGenerator from "./pages/dashboard/WhatsAppGenerator";
import CreativeRoulette from "./pages/dashboard/CreativeRoulette";
import BioPage from "@/pages/public/BioPage";
import NotFound from "./pages/NotFound";

import AdminAccessControl from "./pages/admin/AdminAccessControl";
import WaitlistPending from "./pages/WaitlistPending";

const queryClient = new QueryClient();

const App = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/gamification" element={<Gamification />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/sorteios" element={<Raffle />} />
            <Route path="/dashboard/link-bio" element={<LinkBio />} />
            <Route path="/dashboard/whatsapp-link" element={<WhatsAppGenerator />} />
            <Route path="/dashboard/roleta" element={<CreativeRoulette />} />
            <Route path="/waitlist-pending" element={<WaitlistPending />} />

            {/* Public Bio Route */}
            <Route path="/bio/:username" element={<BioPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout><AdminOverview /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/access" element={<AdminLayout><AdminAccessControl /></AdminLayout>} />
            <Route path="/admin/plans" element={<AdminLayout><AdminPlans /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><Settings /></AdminLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;
