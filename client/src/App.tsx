import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import GisData from "@/pages/gis-data";
import PropertyData from "@/pages/property-data";
import ScanHistory from "@/pages/scan-history";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 overflow-auto md:ml-64">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      <Route path="/gis-data" component={() => (
        <AppLayout>
          <GisData />
        </AppLayout>
      )} />
      <Route path="/property-data" component={() => (
        <AppLayout>
          <PropertyData />
        </AppLayout>
      )} />
      <Route path="/scan-history" component={() => (
        <AppLayout>
          <ScanHistory />
        </AppLayout>
      )} />
      <Route path="/settings" component={() => (
        <AppLayout>
          <Settings />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
