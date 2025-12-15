import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  Home,
  LogOut,
  Map,
  Menu,
  PieChart,
  Settings,
  Shield,
  Users,
  Vote,
  X,
  Eye,
  User,
  Cog,
  FileText,
  HardDrive,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

// Itens de navegação principal (visíveis para todos ou baseado em roles específicas)
const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
  { label: "Eleitorado", href: "/eleitorado", icon: <Users className="w-5 h-5" /> },
  { label: "Resultados", href: "/resultados", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Votos Nulos/Brancos", href: "/votos-nulos", icon: <Vote className="w-5 h-5" /> },
  { label: "Mapas de Calor", href: "/mapas", icon: <Map className="w-5 h-5" /> },
  { label: "Importar Dados", href: "/importar", icon: <FileSpreadsheet className="w-5 h-5" />, roles: ["admin", "gestor"] },
  { label: "Demonstração", href: "/demo", icon: <Eye className="w-5 h-5" /> },
];

// Itens de administração (visíveis apenas para administradores)
const adminNavItems: NavItem[] = [
  { label: "Usuários", href: "/usuarios", icon: <Shield className="w-5 h-5" />, roles: ["admin"] },
  { label: "Relatórios Admin", href: "/relatorios-admin", icon: <PieChart className="w-5 h-5" />, roles: ["admin"] },
  { label: "Logs de Auditoria", href: "/logs-auditoria", icon: <FileText className="w-5 h-5" />, roles: ["admin"] },
  { label: "Backup de Dados", href: "/backup", icon: <HardDrive className="w-5 h-5" />, roles: ["admin"] },
  { label: "Configurações", href: "/configuracoes", icon: <Settings className="w-5 h-5" />, roles: ["admin"] },
];

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor de Campanha",
    politico: "Político",
    demo: "Demonstração",
  };
  return labels[role] || role;
}

function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gestor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    politico: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    demo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return colors[role] || colors.demo;
}

export function DTELayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredMainNavItems = mainNavItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const filteredAdminNavItems = adminNavItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const isAdmin = user?.role === "admin";

  if (loading) {
    return <DTELayoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/dataro-logo.jpeg" 
              alt="DATA-RO" 
              className="w-10 h-10 rounded-lg shadow"
            />
            <span className="font-semibold">DTE</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <img 
                src="/dataro-logo.jpeg" 
                alt="DATA-RO" 
                className="w-12 h-12 rounded-xl shadow-lg"
              />
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">DTE</h1>
                <p className="text-xs text-muted-foreground">Data Tracking Eleitoral</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredMainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "dte-nav-item",
                  location === item.href && "active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Admin Section - Only visible for admins */}
          {isAdmin && filteredAdminNavItems.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <Cog className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administração
                </span>
              </div>
              <div className="space-y-1 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
                {filteredAdminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "dte-nav-item",
                      location === item.href && "active"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-sidebar-foreground truncate">
                        {user.name || "Usuário"}
                      </p>
                      <span className={cn("dte-badge text-[10px]", getRoleBadgeColor(user.role))}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/perfil">
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function DTELayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </aside>
      <main className="lg:pl-72 min-h-screen">
        <div className="p-6 lg:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DTELayout;
