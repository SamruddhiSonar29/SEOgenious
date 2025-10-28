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
import Dashboard from "@/pages/Dashboard";
import Keywords from "@/pages/Keywords";
import Content from "@/pages/Content";
import Competitors from "@/pages/Competitors";
import Chatbot from "@/pages/Chatbot";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
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
