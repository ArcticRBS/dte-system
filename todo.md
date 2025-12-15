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
