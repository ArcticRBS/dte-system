import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Database,
  Shield,
  Settings,
  Users,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
};

const categoryIcons: Record<string, React.ReactNode> = {
  backup: <Database className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  user: <Users className="w-4 h-4" />,
  import: <FileSpreadsheet className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  backup: "Backup",
  security: "Segurança",
  system: "Sistema",
  user: "Usuário",
  import: "Importação",
};

export default function Notificacoes() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(
    { limit: 100 },
    { enabled: user?.role === "admin" }
  );

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações foram marcadas como lidas");
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Notificação removida");
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  // Redirect non-admin users
  if (!authLoading && (!user || user.role !== "admin")) {
    setLocation("/dashboard");
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <DTELayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DTELayout>
    );
  }

  return (
    <DTELayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-500" />
              Central de Notificações
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Alertas e atualizações importantes do sistema
            </p>
          </div>
          {notifications && notifications.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || !unreadCount}
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`dte-card transition-all ${
                  !notification.isRead
                    ? "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {typeIcons[notification.type || "info"]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {notification.category && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            {categoryIcons[notification.category]}
                            {categoryLabels[notification.category]}
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString("pt-BR")
                            : "—"}
                        </span>
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            Ver detalhes
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Remover esta notificação?")) {
                            deleteMutation.mutate({ id: notification.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="dte-card">
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você será notificado sobre eventos importantes do sistema
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DTELayout>
  );
}
