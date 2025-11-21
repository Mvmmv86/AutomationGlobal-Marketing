import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// ============================================
// GUARDS DE AUTENTICAÇÃO
// ============================================
import { AdminGuard } from "@/admin/components/AdminGuard";
import { AppGuard } from "@/app/components/AppGuard";

// ============================================
// ADMIN PLATFORM PAGES (Super Admin)
// ============================================
import AdminLogin from "@/admin/pages/AdminLogin";
import AdminDashboard from "@/pages/admin-dashboard-final";
import OrganizationsManagementComplete from "@/pages/organizations-management-complete";
import AIManagementGlobal from "@/pages/ai-management-global";

// ============================================
// CLIENT PLATFORM PAGES (Marketing Users)
// ============================================
import ClientLogin from "@/app/pages/ClientLogin";
import ClientRegister from "@/app/pages/ClientRegister";
import MarketingDashboardComplete from "@/pages/MarketingDashboardComplete";
import BlogAutomation from "@/pages/BlogAutomation";
import AutomationDashboard from "@/pages/AutomationDashboard";
import AudienceDashboard from "@/pages/AudienceDashboard";
import SocialMediaCallback from "@/pages/SocialMediaCallback";

// ============================================
// SHARED/UTILITY PAGES
// ============================================
import NotFound from "@/pages/not-found";

// ============================================
// DEV/TEST PAGES (only in development)
// ============================================
const isDevelopment = import.meta.env.MODE === 'development';

let DatabaseTest, DatabaseConnectionTest, SecurityTest, CacheQueueTest;
let BackendTest, BackendTestReal, RealDataTest, AuthTest;
let MultiTenantTest, PermissionsTest, RateLimitTest;

if (isDevelopment) {
  // Import test pages dynamically only in development
  DatabaseTest = (await import("@/dev/pages/database-test")).default;
  DatabaseConnectionTest = (await import("@/dev/pages/database-connection-test")).default;
  SecurityTest = (await import("@/dev/pages/security-test")).default;
  CacheQueueTest = (await import("@/dev/pages/cache-queue-test")).default;
  BackendTest = (await import("@/dev/pages/backend-test")).default;
  BackendTestReal = (await import("@/dev/pages/backend-test-real")).default;
  RealDataTest = (await import("@/dev/pages/real-data-test")).default;
  AuthTest = (await import("@/dev/pages/auth-test")).default;
  MultiTenantTest = (await import("@/dev/pages/multi-tenant-test")).default;
  PermissionsTest = (await import("@/dev/pages/permissions-test")).default;
  RateLimitTest = (await import("@/dev/pages/rate-limit-test")).default;
}

function Router() {
  return (
    <Switch>
      {/* ========================================
          ROOT - Landing/Redirect
      ======================================== */}
      <Route path="/" component={() => {
        // TODO: Create proper landing page
        // For now, redirect based on auth status
        const adminToken = localStorage.getItem('adminToken');
        const clientToken = localStorage.getItem('token');

        if (adminToken) {
          window.location.href = '/admin/dashboard';
          return null;
        } else if (clientToken) {
          window.location.href = '/app/dashboard';
          return null;
        } else {
          window.location.href = '/login';
          return null;
        }
      }} />

      {/* ========================================
          ADMIN PLATFORM ROUTES (Protected)
          Access: super_admin, org_owner
      ======================================== */}
      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/admin/dashboard" component={() => (
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      )} />

      <Route path="/admin/organizations" component={() => (
        <AdminGuard>
          <OrganizationsManagementComplete />
        </AdminGuard>
      )} />

      <Route path="/admin/ai-management" component={() => (
        <AdminGuard>
          <AIManagementGlobal />
        </AdminGuard>
      )} />

      {/* ========================================
          CLIENT PLATFORM ROUTES (Protected)
          Access: org_admin, org_manager, org_user, org_viewer
      ======================================== */}
      <Route path="/login" component={ClientLogin} />
      <Route path="/register" component={ClientRegister} />

      {/* OAuth Callback (não precisa de guard - redireciona automaticamente) */}
      <Route path="/app/social/callback" component={SocialMediaCallback} />

      {/* Main Dashboard with Tabs - All Protected */}
      <Route path="/app/dashboard" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="dashboard" />
        </AppGuard>
      )} />

      <Route path="/app/campaigns" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="campaigns" />
        </AppGuard>
      )} />

      <Route path="/app/content" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="content" />
        </AppGuard>
      )} />

      <Route path="/app/automation" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="automation" />
        </AppGuard>
      )} />

      <Route path="/app/analytics" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="analytics" />
        </AppGuard>
      )} />

      <Route path="/app/audience" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="audience" />
        </AppGuard>
      )} />

      <Route path="/app/reports" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="reports" />
        </AppGuard>
      )} />

      <Route path="/app/billing" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="billing" />
        </AppGuard>
      )} />

      <Route path="/app/settings" component={() => (
        <AppGuard>
          <MarketingDashboardComplete initialTab="settings" />
        </AppGuard>
      )} />

      {/* Dedicated Pages - Protected */}
      <Route path="/app/blog" component={() => (
        <AppGuard>
          <BlogAutomation />
        </AppGuard>
      )} />

      <Route path="/app/automation-builder" component={() => (
        <AppGuard>
          <AutomationDashboard />
        </AppGuard>
      )} />

      <Route path="/app/audience-manager" component={() => (
        <AppGuard>
          <AudienceDashboard />
        </AppGuard>
      )} />

      {/* ========================================
          LEGACY ROUTES (temporary redirects)
      ======================================== */}
      {/* Redirect old admin routes */}
      <Route path="/admin-dashboard" component={() => {
        window.location.href = '/admin/dashboard';
        return null;
      }} />
      <Route path="/organizations" component={() => {
        window.location.href = '/admin/organizations';
        return null;
      }} />
      <Route path="/ai-management" component={() => {
        window.location.href = '/admin/ai-management';
        return null;
      }} />

      {/* Redirect old marketing routes */}
      <Route path="/marketing" component={() => {
        window.location.href = '/app/dashboard';
        return null;
      }} />
      <Route path="/marketing/:tab" component={({ params }) => {
        window.location.href = `/app/${params.tab}`;
        return null;
      }} />
      <Route path="/automation/blog" component={() => {
        window.location.href = '/app/blog';
        return null;
      }} />

      {/* ========================================
          DEV/TEST ROUTES (development only)
      ======================================== */}
      {isDevelopment && DatabaseTest && (
        <>
          <Route path="/dev/database-test" component={DatabaseTest} />
          <Route path="/dev/database-connection" component={DatabaseConnectionTest} />
          <Route path="/dev/security-test" component={SecurityTest} />
          <Route path="/dev/cache-queue-test" component={CacheQueueTest} />
          <Route path="/dev/backend-test" component={BackendTest} />
          <Route path="/dev/backend-test-real" component={BackendTestReal} />
          <Route path="/dev/real-data-test" component={RealDataTest} />
          <Route path="/dev/auth-test" component={AuthTest} />
          <Route path="/dev/multi-tenant-test" component={MultiTenantTest} />
          <Route path="/dev/permissions-test" component={PermissionsTest} />
          <Route path="/dev/rate-limit-test" component={RateLimitTest} />
        </>
      )}

      {/* ========================================
          404 NOT FOUND
      ======================================== */}
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
