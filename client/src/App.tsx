import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ElectronProvider } from "@/hooks/use-electron";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Editor from "@/pages/editor";
import NotFound from "@/pages/not-found";
import TerminalPage from "@/pages/terminal";
import SettingsPage from "@/pages/settings";
import Documentation from "@/pages/documentation";
import AdminApproval from "@/pages/admin-approval";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/editor/:projectId?" component={Editor} />
      <Route path="/terminal" component={TerminalPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/docs" component={Documentation} />
      <Route path="/admin/approvals" component={AdminApproval} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ElectronProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ElectronProvider>
    </QueryClientProvider>
  );
}

export default App;
