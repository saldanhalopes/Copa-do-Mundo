import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Album from "./pages/Album";
import Shop from "./pages/Shop";
import Arena from "./pages/Arena";
import Ranking from "./pages/Ranking";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/album" component={Album} />
        <Route path="/shop" component={Shop} />
        <Route path="/arena" component={Arena} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
