import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import PropertyData from "@/pages/property-data";
import PricingPage from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import ReportQuestions from "@/pages/report-questions";
import ReportSuccess from "@/pages/report-success";
import PaymentSuccess from "@/pages/payment-success";
import ReportGenerator from "@/pages/report-generator";
import Chat from "@/pages/chat";
import PremiumChat from "@/pages/premium-chat";
import ReportPage from "@/pages/report";

import { Link } from "wouter";
import { Sidebar } from "@/components/sidebar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <Sidebar />
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 md:ml-0">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <PropertyData />
        </AppLayout>
      )} />
      <Route path="/reports" component={() => (
        <AppLayout>
          <ReportGenerator />
        </AppLayout>
      )} />

      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={() => (
        <PaymentSuccess />
      )} />
      <Route path="/chat" component={Chat} />
      <Route path="/premium-chat" component={() => (
        <AppLayout>
          <PremiumChat />
        </AppLayout>
      )} />
      <Route path="/report/:id" component={() => (
        <AppLayout>
          <ReportPage />
        </AppLayout>
      )} />
      <Route path="/report-questions" component={ReportQuestions} />
      <Route path="/report-success" component={ReportSuccess} />
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
