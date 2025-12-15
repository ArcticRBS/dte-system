import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Layers,
  Map,
  PieChart,
  Shield,
  Target,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src="/logo-dte.png" alt="DTE" className="w-20 h-20 rounded-full object-cover border-2 border-teal-500/30" />
          <div className="h-4 w-32 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-dte.png" 
              alt="DTE Logo" 
              className="w-14 h-14 rounded-full object-cover shadow-lg shadow-teal-500/20 border-2 border-teal-500/30"
            />
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">DATA TRACKING</h1>
              <h1 className="font-bold text-lg text-white leading-tight">ELEITORAL - DTE</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/demo">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                Demonstração
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                Acessar Sistema
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-8">
              <Target className="w-4 h-4" />
              Sistema de Inteligência Eleitoral para Campanhas 2026
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              <span className="text-white">Data Tracking</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Eleitoral
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Plataforma completa de <strong className="text-white">rastreamento e análise de dados eleitorais</strong>, 
              com foco especial em votos nulos e brancos, perfil demográfico e 
              visualizações geográficas interativas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg px-8 py-6 shadow-2xl shadow-emerald-500/30 gap-2">
                  Acessar Sistema
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-lg px-8 py-6">
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { value: "245K+", label: "Eleitores Analisados" },
                { value: "45", label: "Zonas Eleitorais" },
                { value: "52", label: "Bairros Mapeados" },
                { value: "8+", label: "Anos de Dados" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Funcionalidades Principais</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Ferramentas poderosas para análise e visualização de dados eleitorais
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: "Perfil do Eleitorado",
                description: "Análise demográfica completa por faixa etária, gênero, escolaridade e renda",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: BarChart3,
                title: "Resultados Eleitorais",
                description: "Visualização de resultados por partido e candidato com comparação entre eleições",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Vote,
                title: "Votos Nulos e Brancos",
                description: "Rastreamento detalhado de votos nulos, brancos e abstenções por região",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: Map,
                title: "Mapas de Calor",
                description: "Visualização geográfica interativa da distribuição eleitoral com Google Maps",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: FileSpreadsheet,
                title: "Importação de Dados",
                description: "Carregue datasets eleitorais em formato CSV ou Excel com validação automática",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Shield,
                title: "Controle de Acesso",
                description: "Sistema RBAC com 4 níveis: Administrador, Gestor, Político e Demonstração",
                color: "from-rose-500 to-pink-500",
              },
            ].map((feature) => (
              <Card key={feature.title} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="py-24 px-4 bg-slate-800/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Níveis de Acesso</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Sistema de permissões granular para diferentes perfis de usuário
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Administrador",
                description: "Acesso total ao sistema, gerenciamento de usuários e importação de dados",
                icon: Shield,
                color: "from-red-500 to-rose-600",
                features: ["Gerenciar usuários", "Importar dados", "Configurar sistema"],
              },
              {
                title: "Gestor de Campanha",
                description: "Importação de dados, visualização de relatórios e gestão de campanhas",
                icon: Layers,
                color: "from-blue-500 to-indigo-600",
                features: ["Importar datasets", "Gerar relatórios", "Analisar dados"],
              },
              {
                title: "Político",
                description: "Visualização de dashboards e relatórios personalizados",
                icon: TrendingUp,
                color: "from-purple-500 to-violet-600",
                features: ["Ver dashboards", "Acessar relatórios", "Consultar mapas"],
              },
              {
                title: "Demonstração",
                description: "Acesso limitado à área de demonstração com dados de exemplo",
                icon: Globe,
                color: "from-slate-500 to-slate-600",
                features: ["Explorar demo", "Ver exemplos", "Testar recursos"],
              },
            ].map((level) => (
              <Card key={level.title} className="bg-white/5 border-white/10 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${level.color}`} />
                <CardContent className="p-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color} w-fit mb-4`}>
                    <level.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{level.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{level.description}</p>
                  <ul className="space-y-2">
                    {level.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTIgMC00IDItNCAyczItNCA0LTRjMiAwIDQgMiA0IDRzMiA0IDIgNGMwIDItMiA0LTIgNHMtMiAyLTQgMmMtMiAwLTQtMi00LTJzLTItNC0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <CardContent className="p-12 md:p-16 text-center relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Pronto para transformar sua campanha?
                </h2>
                <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">
                  Acesse dados eleitorais detalhados e tome decisões estratégicas baseadas em informações precisas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="bg-white text-emerald-600 hover:bg-white/90 text-lg px-8 py-6 shadow-xl gap-2">
                      Começar Agora
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </a>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6">
                      Ver Demonstração
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10 bg-slate-900/50">
        <div className="container">
          <div className="flex flex-col items-center gap-6">
            {/* Logos DATA-RO | DTE */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* DATA-RO */}
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-dataro.jpeg" 
                  alt="DATA-RO Logo" 
                  className="w-14 h-14 object-contain"
                />
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-white text-sm">DATA-RO</h4>
                  <p className="text-emerald-400 text-xs">INTELIGÊNCIA TERRITORIAL</p>
                </div>
              </div>
              
              {/* Barra Divisória (Pipe) */}
              <div className="hidden sm:block w-px h-12 bg-slate-600"></div>
              <div className="sm:hidden w-16 h-px bg-slate-600"></div>
              
              {/* DTE */}
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-dte.png" 
                  alt="DTE Logo" 
                  className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-teal-500/30"
                />
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-white text-sm">DATA TRACKING ELEITORAL</h4>
                  <p className="text-teal-400 text-xs">DTE - Inteligência Eleitoral</p>
                </div>
              </div>
            </div>
            
            {/* Todos os direitos reservados */}
            <p className="text-slate-500 text-xs">
              Todos os direitos reservados
            </p>
            
            {/* Copyright */}
            <div className="text-center">
              <p className="text-slate-500 text-xs">
                © {new Date().getFullYear()} DATA-RO INTELIGÊNCIA TERRITORIAL | DATA TRACKING ELEITORAL - DTE
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
