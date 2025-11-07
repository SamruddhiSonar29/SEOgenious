import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import KeywordDensity from "@/pages/KeywordDensity";
import Dashboard from "@/pages/Dashboard";
import Keywords from "@/pages/Keywords";
import Content from "@/pages/Content";
import Competitors from "@/pages/Competitors";
import Chatbot from "@/pages/Chatbot";
import RankTracking from "@/pages/RankTracking";
import Backlinks from "@/pages/Backlinks";
import Trends from "@/pages/Trends";
import ContentPlanner from "@/pages/ContentPlanner";
import SeoScoreDashboard from "@/pages/SeoScoreDashboard";
import SavedItems from "@/pages/SavedItems";
import Profile from "@/pages/Profile";
import SeoAudit from "@/pages/SeoAudit";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/tools/keyword-density" component={KeywordDensity} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/keywords">
        <ProtectedRoute>
          <Keywords />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/content">
        <ProtectedRoute>
          <Content />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/competitors">
        <ProtectedRoute>
          <Competitors />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/chatbot">
        <ProtectedRoute>
          <Chatbot />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/rank-tracking">
        <ProtectedRoute>
          <RankTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/seo-audit">
        <ProtectedRoute>
          <SeoAudit />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/backlinks">
        <ProtectedRoute>
          <Backlinks />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/trends">
        <ProtectedRoute>
          <Trends />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/content-planner">
        <ProtectedRoute>
          <ContentPlanner />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/seo-score">
        <ProtectedRoute>
          <SeoScoreDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/saved">
        <ProtectedRoute>
          <SavedItems />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
