import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Eleitorado from "./pages/Eleitorado";
import Resultados from "./pages/Resultados";
import VotosNulos from "./pages/VotosNulos";
import Mapas from "./pages/Mapas";
import Importar from "./pages/Importar";
import Usuarios from "./pages/Usuarios";
import Demo from "./pages/Demo";
import Relatorios from "./pages/Relatorios";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/demo" component={Demo} />
      
      {/* Protected Routes - Dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/eleitorado" component={Eleitorado} />
      <Route path="/resultados" component={Resultados} />
      <Route path="/votos-nulos" component={VotosNulos} />
      <Route path="/mapas" component={Mapas} />
      <Route path="/relatorios" component={Relatorios} />
      
      {/* Admin/Gestor Routes */}
      <Route path="/importar" component={Importar} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/perfil" component={Perfil} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
