import { DTELayout } from "@/components/DTELayout";
import { ElectoralHeatmap, bairrosPortoVelho } from "@/components/ElectoralHeatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Map, MapPin, TrendingUp, TrendingDown, Users, Vote, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

export default function Mapas() {
  const [anoSelecionado, setAnoSelecionado] = useState("2024");
  const [selectedBairro, setSelectedBairro] = useState<typeof bairrosPortoVelho[0] | null>(null);

  // Calculate totals
  const totals = useMemo(() => {
    return bairrosPortoVelho.reduce(
      (acc, bairro) => ({
        eleitores: acc.eleitores + bairro.eleitores,
        nulos: acc.nulos + bairro.nulos,
        brancos: acc.brancos + bairro.brancos,
        pt: acc.pt + bairro.pt,
        pl: acc.pl + bairro.pl,
        mdb: acc.mdb + bairro.mdb,
      }),
      { eleitores: 0, nulos: 0, brancos: 0, pt: 0, pl: 0, mdb: 0 }
    );
  }, []);

  // Sort bairros by different metrics
  const topBairrosByEleitores = useMemo(
    () => [...bairrosPortoVelho].sort((a, b) => b.eleitores - a.eleitores).slice(0, 5),
    []
  );

  const topBairrosByNulos = useMemo(
    () =>
      [...bairrosPortoVelho]
        .sort((a, b) => (b.nulos + b.brancos) / b.eleitores - (a.nulos + a.brancos) / a.eleitores)
        .slice(0, 5),
    []
  );

  return (
    <DTELayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mapas de Calor</h1>
            <p className="text-muted-foreground">
              Visualização geográfica interativa da distribuição eleitoral
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total de Eleitores</p>
                  <p className="text-2xl font-bold text-blue-600">{totals.eleitores.toLocaleString("pt-BR")}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Votos Nulos</p>
                  <p className="text-2xl font-bold text-red-600">{totals.nulos.toLocaleString("pt-BR")}</p>
                </div>
                <Vote className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Votos Brancos</p>
                  <p className="text-2xl font-bold text-slate-600">{totals.brancos.toLocaleString("pt-BR")}</p>
                </div>
                <Vote className="w-8 h-8 text-slate-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Bairros Mapeados</p>
                  <p className="text-2xl font-bold text-emerald-600">{bairrosPortoVelho.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              Mapa Eleitoral de Porto Velho - RO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ElectoralHeatmap
              className="h-[600px]"
              onBairroSelect={setSelectedBairro}
            />
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Mapa Interativo com Google Maps</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Este mapa utiliza a API do Google Maps com camada de calor (HeatmapLayer) para visualização 
                  dos dados eleitorais. Clique nos marcadores para ver detalhes de cada bairro. Use os controles 
                  para alternar entre diferentes visualizações: densidade de eleitores, votos nulos/brancos ou 
                  votação por partido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Rankings */}
        <Tabs defaultValue="eleitores" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="eleitores">Maior Eleitorado</TabsTrigger>
            <TabsTrigger value="nulos">Maior % Nulos/Brancos</TabsTrigger>
          </TabsList>

          <TabsContent value="eleitores">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Top 5 Bairros por Número de Eleitores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topBairrosByEleitores.map((bairro, index) => (
                    <div
                      key={bairro.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                        {index + 1}º
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{bairro.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {bairro.eleitores.toLocaleString("pt-BR")} eleitores
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          {((bairro.eleitores / totals.eleitores) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">do total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nulos">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Top 5 Bairros por % de Votos Nulos/Brancos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topBairrosByNulos.map((bairro, index) => {
                    const percentNulos = ((bairro.nulos + bairro.brancos) / bairro.eleitores) * 100;
                    return (
                      <div
                        key={bairro.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-600 font-bold">
                          {index + 1}º
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{bairro.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {(bairro.nulos + bairro.brancos).toLocaleString("pt-BR")} votos nulos/brancos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">{percentNulos.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">do eleitorado</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* All Bairros Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Bairros Mapeados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bairrosPortoVelho.map((bairro) => (
                <div
                  key={bairro.id}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    selectedBairro?.id === bairro.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedBairro(bairro)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{bairro.nome}</h3>
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Eleitores</p>
                      <p className="font-mono font-medium">{bairro.eleitores.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nulos/Brancos</p>
                      <p className="font-mono font-medium text-red-600">
                        {(((bairro.nulos + bairro.brancos) / bairro.eleitores) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
