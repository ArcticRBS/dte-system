# Data Tracking Eleitoral - TODO

## Sistema de Autenticação e RBAC
- [x] Configurar schema do banco com 4 níveis de acesso (admin, gestor, politico, demo)
- [x] Implementar sistema RBAC com procedures protegidas por role
- [x] Criar middleware de verificação de permissões

## Módulo de Importação de Dados
- [x] Criar tabelas para armazenar dados eleitorais importados
- [x] Implementar upload de arquivos CSV/Excel
- [x] Criar processamento e validação de dados eleitorais
- [x] Implementar histórico de importações

## Dashboard Principal
- [x] Criar página de dashboard com estatísticas gerais
- [x] Exibir total de eleitores, zonas, bairros
- [x] Mostrar indicadores de última atualização
- [x] Implementar cards de métricas principais

## Visualização de Perfil de Eleitores
- [x] Gráfico de distribuição por faixa etária
- [x] Gráfico de distribuição por sexo
- [x] Gráfico de distribuição por escolaridade
- [x] Gráfico de distribuição por renda per capita
- [x] Análise por bairro e zona eleitoral

## Análise de Resultados Eleitorais
- [x] Resultados por partido político
- [x] Resultados por candidato
- [x] Comparação entre eleições (2020, 2022, 2024)
- [x] Identificação de partidos mais votados por região

## Rastreamento de Votos Nulos e Brancos
- [x] Dashboard específico para votos nulos/brancos
- [x] Análise por região e zona eleitoral
- [x] Análise por bairro
- [x] Evolução temporal dos votos nulos/brancos

## Mapas de Calor Geográficos
- [x] Visualização simulada de mapas de calor
- [x] Camada de densidade de eleitores por bairro
- [x] Camada de votação por partido
- [x] Camada de perfil demográfico
- [x] Tooltips interativos

## Sistema de Filtros Dinâmicos
- [x] Filtro por região
- [x] Filtro por bairro
- [x] Filtro por zona eleitoral
- [x] Filtro por período/eleição

## Área de Demonstração
- [x] Criar dados de exemplo para demonstração
- [x] Implementar acesso limitado para visitantes
- [x] Página de demonstração com tour guiado

## Relatórios Executivos
- [x] Dashboard personalizado por nível de acesso
- [x] Relatórios para administradores
- [x] Relatórios para gestores de campanha
- [x] Relatórios para políticos

## Interface e Design
- [x] Implementar tema elegante e sofisticado
- [x] Layout responsivo
- [x] Navegação intuitiva com sidebar
- [x] Componentes visuais refinados

## Infraestrutura e Deploy
- [x] Criar repositório GitHub para o projeto
- [ ] Configurar para deploy no Vercel
- [ ] Configurar conexão com Supabase

## Integração Google Maps
- [x] Analisar componente Map.tsx existente
- [x] Implementar mapa de calor com Google Maps Visualization Library
- [x] Adicionar marcadores interativos para bairros
- [x] Criar camadas de dados (eleitores, votos nulos, partidos)
- [x] Integrar filtros dinâmicos com o mapa

## Correções
- [x] Corrigir landing page não aparecendo no deploy Vercel
- [x] Criar landing page profissional com logo DATA-RO
- [x] Atualizar sidebar com logo DATA-RO

## Datasets TSE - Rondônia
- [x] Criar estrutura de tabelas para dados do TSE (eleitores, candidatos, partidos, coligações)
- [x] Implementar upload de CSV/Excel para eleitores
- [x] Implementar upload para candidatos
- [x] Implementar upload para partidos e coligações
- [x] Criar templates de importação
- [x] Documentar formato esperado dos arquivos

## Importação de Dados TSE - Dezembro 2024
- [ ] Extrair arquivos ZIP do TSE (2020, 2022, 2024)
- [ ] Filtrar dados de Rondônia
- [ ] Popular tabela eleitorado_tse
- [ ] Popular tabela candidatos_tse
- [ ] Popular tabela coligacoes_tse
- [ ] Popular tabela partidos_tse
- [ ] Importar dados de comparecimento/abstenção
- [ ] Configurar DNS do domínio dte.api.br
- [ ] Criar usuários gestores no sistema

## Sistema de Login Tradicional
- [x] Atualizar schema do banco para suportar login com senha
- [x] Implementar hash de senha com bcrypt
- [x] Criar rotas de autenticação (login, registro, logout)
- [x] Criar página de login
- [x] Criar página de registro
- [x] Preparar estrutura para SSO futuro (Google, GitHub)

## Página de Perfil de Usuário
- [x] Criar página de perfil com visualização de dados
- [x] Implementar formulário de edição de dados cadastrais
- [x] Adicionar funcionalidade de alteração de senha
- [x] Criar rotas de atualização no backend

## Upload de Foto de Perfil
- [x] Adicionar campo avatarUrl ao schema de usuários
- [x] Implementar upload de imagem (base64 para demo)
- [x] Criar componente de upload de foto na página de perfil
- [x] Exibir foto no avatar do perfil

## Histórico de Atividades
- [x] Criar tabela de atividades no banco de dados
- [x] Registrar ações do usuário (login, importação, etc.)
- [x] Criar página/aba de histórico de atividades
- [x] Exibir últimas atividades no perfil

## Configurações do Sistema
- [x] Criar página de configurações para administradores
- [x] Implementar configurações de aparência (cores, logo)
- [x] Adicionar configurações de notificações
- [x] Criar seção de integrações (SSO, APIs)

## Reorganização do Menu Lateral
- [x] Separar área de administração na parte inferior do menu
- [x] Exibir seção admin apenas para usuários administradores
- [x] Incluir Usuários e Configurações na seção admin

## Relatórios Gerenciais Admin
- [x] Criar página de relatórios exclusiva para administradores
- [x] Implementar métricas de uso do sistema
- [x] Adicionar estatísticas de usuários e acessos
- [x] Criar gráficos de atividade do sistema

## Logs de Auditoria
- [x] Criar página para visualizar logs de auditoria
- [x] Exibir todas as ações realizadas no sistema
- [x] Implementar filtros por usuário, tipo de ação e data
- [x] Adicionar exportação de logs

## Backup e Exportação de Dados
- [x] Criar página de backup para administradores
- [x] Implementar exportação de eleitores em CSV/Excel
- [x] Implementar exportação de resultados eleitorais
- [x] Implementar exportação de usuários do sistema

## Agendamento de Backups Automáticos
- [x] Criar tabela de configuração de backups agendados
- [x] Implementar interface de configuração de periodicidade
- [x] Adicionar opção de envio por email
- [x] Criar histórico de backups executados

## Dashboard Comparativo
- [x] Criar página de comparação de métricas
- [x] Implementar comparação semana atual vs anterior
- [x] Implementar comparação mês atual vs anterior
- [x] Adicionar gráficos de tendência

## Menu Admin Colapsável
- [x] Implementar seção de administração minimizável
- [x] Salvar estado do menu no localStorage
- [x] Adicionar animação suave de expansão/colapso

## Execução Real de Backups
- [x] Criar endpoint para executar backup manualmente
- [x] Implementar geração de arquivos CSV/JSON
- [x] Configurar envio de email com anexo
- [x] Atualizar histórico de backups

## Notificações Push Admin
- [x] Criar tabela de notificações no banco
- [x] Implementar sistema de alertas para admin
- [x] Adicionar badge de notificações no menu
- [x] Criar página de central de notificações

## Exportação PDF de Relatórios
- [x] Implementar geração de PDF do dashboard comparativo
- [x] Adicionar botão de exportar PDF
- [x] Incluir gráficos e métricas no PDF
