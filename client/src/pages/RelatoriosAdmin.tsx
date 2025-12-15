import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Users,
  Activity,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  politico: "Político",
  demo: "Demonstração",
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

export default function RelatoriosAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = trpc.adminReports.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </DTELayout>
    );
  }

  const usersByRoleData = stats?.usersByRole?.map((item) => ({
    name: roleLabels[item.role] || item.role,
    value: Number(item.count),
  })) || [];

  const activitiesByTypeData = stats?.activitiesByType?.map((item) => ({
    name: activityLabels[item.activityType] || item.activityType,
    value: Number(item.count),
  })) || [];

  const activitiesByDayData = stats?.activitiesByDay?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
    atividades: Number(item.count),
  })) || [];

  const totalUsers = usersByRoleData.reduce((acc, item) => acc + item.value, 0);
  const totalActivities = activitiesByTypeData.reduce((acc, item) => acc + item.value, 0);

  return (
    <DTELayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Métricas e estatísticas do sistema para administradores
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dte-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuários
              </CardTitle>
              <Users className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="dte-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atividades (30 dias)
              </CardTitle>
              <Activity className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalActivities}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ações realizadas no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="dte-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Importações
              </CardTitle>
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.totalImportacoes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Arquivos importados
              </p>
            </CardContent>
          </Card>

          <Card className="dte-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuários Ativos
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.topUsers?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Com atividade recente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role */}
          <Card className="dte-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Usuários por Perfil
              </CardTitle>
              <CardDescription>Distribuição de usuários por nível de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={usersByRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usersByRoleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activities by Type */}
          <Card className="dte-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Atividades por Tipo
              </CardTitle>
              <CardDescription>Tipos de ações realizadas nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activitiesByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="dte-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Atividades por Dia
            </CardTitle>
            <CardDescription>Volume de atividades nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activitiesByDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="atividades"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="dte-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Usuários Mais Ativos
            </CardTitle>
            <CardDescription>Top 10 usuários com mais atividades no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Atividades</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topUsers?.map((user, index) => (
                    <tr key={user.userId} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{user.userName || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.userEmail || "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {user.activityCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.topUsers || stats.topUsers.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma atividade registrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
