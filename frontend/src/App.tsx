import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import React, { Suspense, lazy } from "react";

// Lazy Loaded Pages
const Landing = lazy(() => import("@/pages/Landing"));
const Home = lazy(() => import("@/pages/Home"));
const History = lazy(() => import("@/pages/History"));
const Report = lazy(() => import("@/pages/Report"));
const Upload = lazy(() => import("@/pages/Upload"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Auth = lazy(() => import("@/pages/Auth"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

import { ChatBot } from "@/components/ChatBot";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <Switch>
        <Route path="/landing" component={Landing} />
        <Route path="/auth" component={Auth} />
        <Route path="/admin-portal" component={AdminDashboard} />

        {!user ? (
          <Route component={() => <Auth />} />
        ) : (
          <Route path="/" component={Home} />
        )}

        {/* Protected Routes handled via auth check above, but for clean routing we define them */}
        {user && (
          <>
            <Route path="/history" component={History} />
            <Route path="/analysis/:id" component={Report} />
            <Route path="/upload" component={Upload} />
            {/* Fallback for authenticated users */}
            <Route component={NotFound} />
          </>
        )}
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <ChatBot />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
