import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Users,
  Vote,
  BarChart3,
  Activity,
  FileSpreadsheet,
  Database,
  HardDrive,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onExportCSV: () => void;
  onExportJSON: () => void;
  isLoading: boolean;
  recordCount?: number;
  children?: React.ReactNode;
}

function ExportCard({
  title,
  description,
  icon,
  onExportCSV,
  onExportJSON,
  isLoading,
  recordCount,
  children,
}: ExportCardProps) {
  return (
    <Card className="dte-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {recordCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="w-4 h-4" />
            <span>{recordCount.toLocaleString("pt-BR")} registros disponíveis</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={onExportCSV}
            disabled={isLoading}
            className="flex-1 gap-2"
            variant="default"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Exportar CSV
          </Button>
          <Button
            onClick={onExportJSON}
            disabled={isLoading}
            className="flex-1 gap-2"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackupDados() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [anoEleitorado, setAnoEleitorado] = useState<string>("all");
  const [anoResultados, setAnoResultados] = useState<string>("all");
  const [cargoResultados, setCargoResultados] = useState<string>("all");

  // Queries for export
  const usersQuery = trpc.backup.users.useQuery(undefined, {
    enabled: false,
  });

  const eleitoradoQuery = trpc.backup.eleitorado.useQuery(
    { anoEleicao: anoEleitorado !== "all" ? Number(anoEleitorado) : undefined },
    { enabled: false }
  );

  const resultadosQuery = trpc.backup.resultados.useQuery(
    {
      anoEleicao: anoResultados !== "all" ? Number(anoResultados) : undefined,
      cargo: cargoResultados !== "all" ? cargoResultados : undefined,
    },
    { enabled: false }
  );

  const activitiesQuery = trpc.backup.activities.useQuery(undefined, {
    enabled: false,
  });

  // Redirect non-admin users
  if (!authLoading && (!user || user.role !== "admin")) {
    setLocation("/dashboard");
    return null;
  }

  const handleExportUsers = async (format: "csv" | "json") => {
    try {
      const result = await usersQuery.refetch();
      if (result.data) {
        if (format === "csv") {
          downloadCSV(result.data as Record<string, unknown>[], "usuarios");
        } else {
          downloadJSON(result.data, "usuarios");
        }
        toast.success("Exportação de usuários concluída!");
      }
    } catch (error) {
      toast.error("Erro ao exportar usuários");
    }
  };

  const handleExportEleitorado = async (format: "csv" | "json") => {
    try {
      const result = await eleitoradoQuery.refetch();
      if (result.data) {
        if (format === "csv") {
          downloadCSV(result.data as Record<string, unknown>[], "eleitorado");
        } else {
          downloadJSON(result.data, "eleitorado");
        }
        toast.success("Exportação de eleitorado concluída!");
      }
    } catch (error) {
      toast.error("Erro ao exportar eleitorado");
    }
  };

  const handleExportResultados = async (format: "csv" | "json") => {
    try {
      const result = await resultadosQuery.refetch();
      if (result.data) {
        if (format === "csv") {
          downloadCSV(result.data as Record<string, unknown>[], "resultados_eleitorais");
        } else {
          downloadJSON(result.data, "resultados_eleitorais");
        }
        toast.success("Exportação de resultados concluída!");
      }
    } catch (error) {
      toast.error("Erro ao exportar resultados");
    }
  };

  const handleExportActivities = async (format: "csv" | "json") => {
    try {
      const result = await activitiesQuery.refetch();
      if (result.data) {
        if (format === "csv") {
          downloadCSV(result.data as Record<string, unknown>[], "atividades");
        } else {
          downloadJSON(result.data, "atividades");
        }
        toast.success("Exportação de atividades concluída!");
      }
    } catch (error) {
      toast.error("Erro ao exportar atividades");
    }
  };

  if (authLoading) {
    return (
      <DTELayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup e Exportação</h1>
          <p className="text-muted-foreground">
            Exporte os dados do sistema em formato CSV ou JSON
          </p>
        </div>

        {/* Info Card */}
        <Card className="dte-card bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <HardDrive className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Backup de Dados
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Os dados exportados podem ser usados para backup, análise externa ou migração.
                  Todas as exportações são registradas no log de auditoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Export */}
          <ExportCard
            title="Usuários do Sistema"
            description="Exportar lista de todos os usuários cadastrados"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            onExportCSV={() => handleExportUsers("csv")}
            onExportJSON={() => handleExportUsers("json")}
            isLoading={usersQuery.isFetching}
          />

          {/* Eleitorado Export */}
          <ExportCard
            title="Dados do Eleitorado"
            description="Exportar dados de perfil do eleitorado"
            icon={<Vote className="w-5 h-5 text-emerald-500" />}
            onExportCSV={() => handleExportEleitorado("csv")}
            onExportJSON={() => handleExportEleitorado("json")}
            isLoading={eleitoradoQuery.isFetching}
          >
            <Select value={anoEleitorado} onValueChange={setAnoEleitorado}>
              <SelectTrigger>
                <SelectValue placeholder="Ano da eleição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </ExportCard>

          {/* Resultados Export */}
          <ExportCard
            title="Resultados Eleitorais"
            description="Exportar resultados de votação"
            icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
            onExportCSV={() => handleExportResultados("csv")}
            onExportJSON={() => handleExportResultados("json")}
            isLoading={resultadosQuery.isFetching}
          >
            <div className="grid grid-cols-2 gap-2">
              <Select value={anoResultados} onValueChange={setAnoResultados}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cargoResultados} onValueChange={setCargoResultados}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="prefeito">Prefeito</SelectItem>
                  <SelectItem value="vereador">Vereador</SelectItem>
                  <SelectItem value="governador">Governador</SelectItem>
                  <SelectItem value="deputado_estadual">Dep. Estadual</SelectItem>
                  <SelectItem value="deputado_federal">Dep. Federal</SelectItem>
                  <SelectItem value="senador">Senador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ExportCard>

          {/* Activities Export */}
          <ExportCard
            title="Histórico de Atividades"
            description="Exportar log de atividades do sistema"
            icon={<Activity className="w-5 h-5 text-purple-500" />}
            onExportCSV={() => handleExportActivities("csv")}
            onExportJSON={() => handleExportActivities("json")}
            isLoading={activitiesQuery.isFetching}
          />
        </div>

        {/* Export History */}
        <Card className="dte-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Informações de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Formato CSV</h4>
                <p className="text-muted-foreground">
                  Ideal para abrir em Excel, Google Sheets ou outros programas de planilha.
                  Compatível com a maioria das ferramentas de análise de dados.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Formato JSON</h4>
                <p className="text-muted-foreground">
                  Ideal para desenvolvedores e integração com outros sistemas.
                  Preserva a estrutura completa dos dados incluindo tipos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
