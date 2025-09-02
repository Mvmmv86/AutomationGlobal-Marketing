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
import BackendTestReal from "@/pages/backend-test-real";
import RealDataTest from "@/pages/real-data-test";
import AuthTest from "@/pages/auth-test";
import MultiTenantTest from "@/pages/multi-tenant-test";
import PermissionsTest from "@/pages/permissions-test";
import RateLimitTest from "@/pages/rate-limit-test";
import AdminDashboard from "@/pages/admin-dashboard-final";
import AdminDashboardComplete from "@/pages/admin-dashboard-complete";
import OrganizationsManagement from "@/pages/organizations-management-simple";
import OrganizationsManagementAdvanced from "@/pages/organizations-management-advanced";
import OrganizationsManagementComplete from "@/pages/organizations-management-complete";
import AIManagementGlobal from "@/pages/ai-management-global";
import AIManagementByOrganization from "@/pages/ai-management-by-organization";
import MarketingDashboard from "@/pages/MarketingDashboard";
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
      <Route path="/backend-test-real" component={BackendTestReal} />
      <Route path="/real-data-test" component={RealDataTest} />
      <Route path="/auth-test" component={AuthTest} />
      <Route path="/multi-tenant-test" component={MultiTenantTest} />
      <Route path="/permissions-test" component={PermissionsTest} />
      <Route path="/rate-limit-test" component={RateLimitTest} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-dashboard-complete" component={AdminDashboardComplete} />
      <Route path="/organizations" component={OrganizationsManagementComplete} />
      <Route path="/organizations-advanced" component={OrganizationsManagementAdvanced} />
      <Route path="/organizations-simple" component={OrganizationsManagement} />
      <Route path="/ai-management" component={AIManagementGlobal} />
      <Route path="/ai-management-org" component={AIManagementByOrganization} />
      <Route path="/marketing/:id" component={MarketingDashboard} />
      <Route path="/marketing" component={() => <MarketingDashboard />} />
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
