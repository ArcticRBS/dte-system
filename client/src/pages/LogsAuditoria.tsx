import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  Activity,
  LogIn,
  LogOut,
  Upload,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";

const activityIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  import: <Upload className="w-4 h-4" />,
  export: <Download className="w-4 h-4" />,
  create: <Plus className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  download: <Download className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  login: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  import: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  export: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  create: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  update: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  view: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  download: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const activityLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  import: "Importação",
  export: "Exportação",
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  view: "Visualização",
  download: "Download",
};

export default function LogsAuditoria() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const { data: activities, isLoading, refetch } = trpc.audit.activities.useQuery(
    { limit },
    { enabled: user?.role === "admin" }
  );

  // Redirect non-admin users
  if (!authLoading && (!user || user.role !== "admin")) {
    setLocation("/dashboard");
    return null;
  }

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch =
      !searchTerm ||
      activity.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "all" || activity.activityType === selectedType;

    return matchesSearch && matchesType;
  });

  if (authLoading || isLoading) {
    return (
      <DTELayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
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
            <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
            <p className="text-muted-foreground">
              Histórico de todas as ações realizadas no sistema
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card className="dte-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, email ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(activityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 itens</SelectItem>
                  <SelectItem value="50">50 itens</SelectItem>
                  <SelectItem value="100">100 itens</SelectItem>
                  <SelectItem value="200">200 itens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card className="dte-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Histórico de Atividades
            </CardTitle>
            <CardDescription>
              {filteredActivities?.length || 0} atividades encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      activityColors[activity.activityType] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {activityIcons[activity.activityType] || <Activity className="w-4 h-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {activity.userName || "Usuário desconhecido"}
                      </span>
                      <Badge
                        variant="secondary"
                        className={activityColors[activity.activityType] || ""}
                      >
                        {activityLabels[activity.activityType] || activity.activityType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description || "Sem descrição"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.userEmail || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.createdAt
                          ? new Date(activity.createdAt).toLocaleString("pt-BR")
                          : "—"}
                      </span>
                      {activity.ipAddress && (
                        <span className="hidden sm:flex items-center gap-1">
                          IP: {activity.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!filteredActivities || filteredActivities.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade encontrada</p>
                  <p className="text-sm mt-1">
                    Tente ajustar os filtros ou aguarde novas atividades
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
