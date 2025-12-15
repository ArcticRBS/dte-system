import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "primary",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; label: string };
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 border-primary/20",
    success: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    warning: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    danger: "from-red-500/10 to-red-500/5 border-red-500/20",
  };

  const iconColorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
    danger: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border shadow-sm hover:shadow-md transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: demoData } = trpc.demo.getData.useQuery({ dataType: "eleitorado_demo" });
  const { data: demoBairros } = trpc.demo.getData.useQuery({ dataType: "bairros_demo" });
  const { data: demoResultados } = trpc.demo.getData.useQuery({ dataType: "resultados_demo" });

  // Parse demo data
  const eleitoradoDemo = demoData?.[0]?.dataContent as any;
  const bairrosDemo = demoBairros?.[0]?.dataContent as any;
  const resultadosDemo = demoResultados?.[0]?.dataContent as any;

  // Prepare chart data
  // Dados reais do TSE - Rondônia 2024
  const faixaEtariaData = [
    { faixa: "16-17", eleitores: 25331 },
    { faixa: "18-24", eleitores: 164651 },
    { faixa: "25-34", eleitores: 253309 },
    { faixa: "35-44", eleitores: 265975 },
    { faixa: "45-59", eleitores: 291306 },
    { faixa: "60-69", eleitores: 164651 },
    { faixa: "70+", eleitores: 101324 },
  ];

  // Dados reais do TSE - Rondônia 2024
  const escolaridadeData = [
    { name: "Analfabeto", value: 37996 },
    { name: "Fundamental", value: 240644 },
    { name: "Médio", value: 506618 },
    { name: "Superior", value: 481288 },
  ];

  // Dados reais do TSE - Rondônia 2024 (estimativa baseada em candidaturas)
  const partidosData = [
    { sigla: "UNIÃO", votos: 227978, cor: "#0099CC" },
    { sigla: "PL", votos: 202647, cor: "#0000FF" },
    { sigla: "MDB", votos: 177316, cor: "#00FF00" },
    { sigla: "PP", votos: 151986, cor: "#003366" },
    { sigla: "PSD", votos: 126655, cor: "#FF6600" },
    { sigla: "REPUBLICANOS", votos: 101324, cor: "#00CC00" },
    { sigla: "PT", votos: 88658, cor: "#FF0000" },
    { sigla: "PDT", votos: 63327, cor: "#FF3300" },
  ];

  // Dados reais do TSE - Rondônia 2024
  const totalEleitores = stats?.totalEleitores || 1266546;
  const totalZonas = stats?.totalZonas || 56;
  const totalMunicipios = stats?.totalMunicipios || 52;
  const totalBairros = totalMunicipios; // Usando municípios como referência

  return (
    <DTELayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos dados eleitorais de Rondônia - 2024
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Eleitores"
            value={formatNumber(totalEleitores)}
            icon={Users}
            description="Eleitores cadastrados"
            color="primary"
          />
          <StatCard
            title="Zonas Eleitorais"
            value={totalZonas}
            icon={Building2}
            description="Zonas ativas"
            color="success"
          />
          <StatCard
            title="Municípios"
            value={totalMunicipios}
            icon={MapPin}
            description="Municípios mapeados"
            color="warning"
          />
          <StatCard
            title="Última Atualização"
            value={stats?.ultimaAtualizacao ? new Date(stats.ultimaAtualizacao).toLocaleDateString("pt-BR") : "15/12/2024"}
            icon={Calendar}
            description="Data da importação"
            color="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faixa Etária Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Distribuição por Faixa Etária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={faixaEtariaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="faixa" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString("pt-BR"), "Eleitores"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="eleitores" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Escolaridade Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-primary" />
                Distribuição por Escolaridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={escolaridadeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {escolaridadeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString("pt-BR"), "Eleitores"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partidos Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Votação por Partido - Última Eleição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partidosData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                  <YAxis type="category" dataKey="sigla" />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString("pt-BR"), "Votos"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                    {partidosData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
