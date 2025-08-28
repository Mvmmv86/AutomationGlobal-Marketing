import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import DatabaseTest from "@/pages/database-test";
import DatabaseConnectionTest from "@/pages/database-connection-test";
import SecurityTest from "@/pages/security-test";
import CacheQueueTest from "@/pages/cache-queue-test";
import BackendTest from "@/pages/backend-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/database-test" component={DatabaseTest} />
      <Route path="/database-connection" component={DatabaseConnectionTest} />
      <Route path="/security-test" component={SecurityTest} />
      <Route path="/cache-queue-test" component={CacheQueueTest} />
      <Route path="/backend-test" component={BackendTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
