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
import Chat from "@/pages/chat";
import FAQPage from "@/pages/faq";
import { Link } from "wouter";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="py-6 px-4 sm:px-6 lg:px-8">
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
      <Route path="/pricing" component={() => (
        <AppLayout>
          <PricingPage />
        </AppLayout>
      )} />
      <Route path="/faq" component={() => (
        <AppLayout>
          <FAQPage />
        </AppLayout>
      )} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/chat" component={Chat} />
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
