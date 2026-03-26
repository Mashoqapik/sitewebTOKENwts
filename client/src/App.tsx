import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VaultAuthProvider, useVaultAuth } from "./contexts/VaultAuthContext";
import Login from "./pages/Login";
import Vault from "./pages/Vault";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useVaultAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/vault">
        {() => <ProtectedRoute component={Vault} />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <VaultAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </VaultAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
