import { DTELayout } from "@/components/DTELayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  History,
  Mail,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

const dataTypeOptions = [
  { value: "users", label: "Usuários", icon: "👥" },
  { value: "eleitorado", label: "Eleitorado", icon: "🗳️" },
  { value: "resultados", label: "Resultados Eleitorais", icon: "📊" },
  { value: "activities", label: "Atividades", icon: "📋" },
];

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

const dayOfWeekLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface BackupFormData {
  name: string;
  dataTypes: string[];
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  emailRecipients: string[];
  format: "csv" | "json";
}

const defaultFormData: BackupFormData = {
  name: "",
  dataTypes: [],
  frequency: "daily",
  timeOfDay: "03:00",
  emailRecipients: [],
  format: "csv",
};

export default function BackupsAgendados() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BackupFormData>(defaultFormData);
  const [emailInput, setEmailInput] = useState("");

  const utils = trpc.useUtils();

  const { data: backups, isLoading } = trpc.scheduledBackups.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: history } = trpc.scheduledBackups.history.useQuery(
    { limit: 20 },
    { enabled: user?.role === "admin" }
  );

  const createMutation = trpc.scheduledBackups.create.useMutation({
    onSuccess: () => {
      toast.success("Backup agendado criado com sucesso!");
      utils.scheduledBackups.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar backup: ${error.message}`);
    },
  });

  const updateMutation = trpc.scheduledBackups.update.useMutation({
    onSuccess: () => {
      toast.success("Backup agendado atualizado!");
      utils.scheduledBackups.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = trpc.scheduledBackups.delete.useMutation({
    onSuccess: () => {
      toast.success("Backup agendado removido!");
      utils.scheduledBackups.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const toggleMutation = trpc.scheduledBackups.toggle.useMutation({
    onSuccess: () => {
      utils.scheduledBackups.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const executeMutation = trpc.scheduledBackups.executeNow.useMutation({
    onSuccess: (data) => {
      toast.success(`Backup executado com sucesso! ${Object.values(data.recordCounts).reduce((a, b) => a + b, 0)} registros exportados.`);
      utils.scheduledBackups.history.invalidate();
      
      // Download the file
      const blob = new Blob([data.fileContent], { type: data.fileName.endsWith('.json') ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(`Erro ao executar backup: ${error.message}`);
    },
  });

  // Redirect non-admin users
  if (!authLoading && (!user || user.role !== "admin")) {
    setLocation("/dashboard");
    return null;
  }

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setEmailInput("");
  };

  const handleOpenDialog = (backup?: typeof backups extends (infer T)[] | undefined ? T : never) => {
    if (backup) {
      setEditingId(backup.id);
      setFormData({
        name: backup.name,
        dataTypes: (backup.dataTypes as string[]) || [],
        frequency: backup.frequency as "daily" | "weekly" | "monthly",
        dayOfWeek: backup.dayOfWeek ?? undefined,
        dayOfMonth: backup.dayOfMonth ?? undefined,
        timeOfDay: backup.timeOfDay || "03:00",
        emailRecipients: (backup.emailRecipients as string[]) || [],
        format: (backup.format as "csv" | "json") || "csv",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (formData.dataTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de dado");
      return;
    }

    const payload = {
      name: formData.name,
      dataTypes: formData.dataTypes,
      frequency: formData.frequency,
      dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : undefined,
      timeOfDay: formData.timeOfDay,
      emailRecipients: formData.emailRecipients.length > 0 ? formData.emailRecipients : undefined,
      format: formData.format,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddEmail = () => {
    if (emailInput && emailInput.includes("@")) {
      setFormData((prev) => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, emailInput],
      }));
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
  };

  if (authLoading || isLoading) {
    return (
      <DTELayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
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
            <h1 className="text-2xl font-bold text-foreground">Backups Agendados</h1>
            <p className="text-muted-foreground">
              Configure backups automáticos com envio por email
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Backup Agendado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Backup Agendado" : "Novo Backup Agendado"}
                </DialogTitle>
                <DialogDescription>
                  Configure a periodicidade e os dados a serem exportados
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Backup</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Backup Semanal Completo"
                  />
                </div>

                {/* Data Types */}
                <div className="space-y-2">
                  <Label>Dados a Exportar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {dataTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50"
                      >
                        <Checkbox
                          id={option.value}
                          checked={formData.dataTypes.includes(option.value)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              dataTypes: checked
                                ? [...prev.dataTypes, option.value]
                                : prev.dataTypes.filter((t) => t !== option.value),
                            }));
                          }}
                        />
                        <label htmlFor={option.value} className="text-sm cursor-pointer">
                          {option.icon} {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          frequency: v as "daily" | "weekly" | "monthly",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency === "weekly" && (
                    <div className="space-y-2">
                      <Label>Dia da Semana</Label>
                      <Select
                        value={formData.dayOfWeek?.toString() || "0"}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, dayOfWeek: Number(v) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOfWeekLabels.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.frequency === "monthly" && (
                    <div className="space-y-2">
                      <Label>Dia do Mês</Label>
                      <Select
                        value={formData.dayOfMonth?.toString() || "1"}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, dayOfMonth: Number(v) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              Dia {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Time and Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.timeOfDay}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, timeOfDay: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, format: v as "csv" | "json" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Email Recipients */}
                <div className="space-y-2">
                  <Label>Destinatários (Email)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email@exemplo.com"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddEmail}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.emailRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.emailRecipients.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => handleRemoveEmail(email)}
                        >
                          <Mail className="w-3 h-3" />
                          {email}
                          <XCircle className="w-3 h-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scheduled Backups List */}
        <div className="grid gap-4">
          {backups?.map((backup) => (
            <Card key={backup.id} className="dte-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{backup.name}</h3>
                      <Badge variant={backup.isActive ? "default" : "secondary"}>
                        {backup.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{frequencyLabels[backup.frequency]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        {(backup.dataTypes as string[])?.length || 0} tipos de dados
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {backup.timeOfDay}
                      </span>
                      {backup.frequency === "weekly" && backup.dayOfWeek !== null && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dayOfWeekLabels[backup.dayOfWeek]}
                        </span>
                      )}
                      {backup.frequency === "monthly" && backup.dayOfMonth && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Dia {backup.dayOfMonth}
                        </span>
                      )}
                      {(backup.emailRecipients as string[])?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {(backup.emailRecipients as string[]).length} destinatário(s)
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        {backup.format?.toUpperCase()}
                      </span>
                    </div>
                    {backup.nextRunAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Próxima execução: {new Date(backup.nextRunAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={executeMutation.isPending}
                      onClick={() => {
                        executeMutation.mutate({
                          scheduledBackupId: backup.id,
                          dataTypes: (backup.dataTypes as string[]) || [],
                          format: (backup.format as "csv" | "json") || "csv",
                          emailRecipients: (backup.emailRecipients as string[]) || [],
                        });
                      }}
                    >
                      {executeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Executar
                    </Button>
                    <Switch
                      checked={backup.isActive ?? false}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: backup.id, isActive: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(backup)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remover este backup agendado?")) {
                          deleteMutation.mutate({ id: backup.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!backups || backups.length === 0) && (
            <Card className="dte-card">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum backup agendado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie um novo backup agendado para começar
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Backup History */}
        <Card className="dte-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Histórico de Execuções
            </CardTitle>
            <CardDescription>Últimas 20 execuções de backups</CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                      {item.status === "failed" && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      {item.status === "running" && (
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">{item.backupName || "Backup Manual"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.startedAt
                            ? new Date(item.startedAt).toLocaleString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {item.fileSize ? (
                        <p className="text-xs text-muted-foreground">
                          {(item.fileSize / 1024).toFixed(1)} KB
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma execução registrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
