import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/components/ui/notification";
import Header from "@/components/layout/header";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Providers from "@/pages/providers";
import Auth from "@/pages/auth";
import Booking from "@/pages/booking";
import Admin from "@/pages/admin";
import AdminSettings from "@/pages/admin-settings";
import AdminRegister from "@/pages/admin-register";
import EnhancedKYCVerification from "@/pages/enhanced-kyc-verification";
import UserDashboard from "@/pages/user-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import NotFound from "@/pages/not-found";
import PaymentInfo from "@/pages/payment-info";
import PaymentTest from "@/pages/PaymentTest";
import PaymentGatewayTest from "@/pages/PaymentGatewayTest";
import { PaymentCallback } from "@/components/payment";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/providers" component={Providers} />
      <Route path="/auth" component={Auth} />
      <Route path="/booking" component={Booking} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin-settings" component={AdminSettings} />
      <Route path="/admin-register" component={AdminRegister} />
      <Route path="/kyc-verification" component={EnhancedKYCVerification} />
      <Route path="/user-dashboard" component={UserDashboard} />
      <Route path="/provider-dashboard" component={ProviderDashboard} />
      <Route path="/payment-callback" component={PaymentCallback} />
      <Route path="/payment-info" component={PaymentInfo} />
      <Route path="/payment-test" component={PaymentTest} />
      <Route path="/payment-gateway-test" component={PaymentGatewayTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Router />
          </div>
          <Toaster />
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
