#!/usr/bin/env node
/**
 * Script para popular dados de demonstração com dados reais do TSE de Rondônia
 * Este script lê os dados processados e os insere via API do sistema
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = '/home/ubuntu/tse-data/dados_processados_ro.json';

async function main() {
  console.log('='.repeat(60));
  console.log('GERANDO DADOS DE DEMONSTRAÇÃO COM DADOS REAIS DO TSE');
  console.log('='.repeat(60));

  // Ler dados processados
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Arquivo não encontrado: ${DATA_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  console.log('\nDados carregados:');
  console.log(`- Total eleitores: ${data.totais.eleitores.toLocaleString()}`);
  console.log(`- Candidatos 2024: ${data.totais.candidatos_2024}`);
  console.log(`- Candidatos 2022: ${data.totais.candidatos_2022}`);
  console.log(`- Candidatos 2020: ${data.totais.candidatos_2020}`);

  // Calcular estatísticas agregadas do eleitorado
  let totalMasculino = 0;
  let totalFeminino = 0;
  let totalEleitores = 0;
  
  const municipiosMap = {};
  
  for (const item of data.eleitorado) {
    totalEleitores += item.total_eleitores;
    totalMasculino += item.masculino;
    totalFeminino += item.feminino;
    
    const mun = item.municipio;
    if (!municipiosMap[mun]) {
      municipiosMap[mun] = {
        nome: mun,
        codigo: item.codigo_municipio,
        total_eleitores: 0,
        masculino: 0,
        feminino: 0,
        zonas: new Set()
      };
    }
    municipiosMap[mun].total_eleitores += item.total_eleitores;
    municipiosMap[mun].masculino += item.masculino;
    municipiosMap[mun].feminino += item.feminino;
    municipiosMap[mun].zonas.add(item.zona);
  }

  const municipios = Object.values(municipiosMap).map(m => ({
    ...m,
    zonas: m.zonas.size
  })).sort((a, b) => b.total_eleitores - a.total_eleitores);

  console.log(`\nMunicípios processados: ${municipios.length}`);
  console.log('Top 5 municípios por eleitorado:');
  municipios.slice(0, 5).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.nome}: ${m.total_eleitores.toLocaleString()} eleitores`);
  });

  // Agregar candidatos por partido
  const partidosCount = {};
  const cargosCount = {};
  
  for (const cand of data.candidatos_2024) {
    const partido = cand.partido_sigla;
    const cargo = cand.cargo;
    
    if (partido) {
      partidosCount[partido] = (partidosCount[partido] || 0) + 1;
    }
    if (cargo) {
      cargosCount[cargo] = (cargosCount[cargo] || 0) + 1;
    }
  }

  console.log('\nCandidatos por cargo (2024):');
  Object.entries(cargosCount).sort((a, b) => b[1] - a[1]).forEach(([cargo, count]) => {
    console.log(`  - ${cargo}: ${count}`);
  });

  // Gerar JSON de demonstração para o sistema
  const demoEleitorado = {
    totalEleitores: totalEleitores,
    masculino: totalMasculino,
    feminino: totalFeminino,
    faixasEtarias: {
      '16-17': Math.round(totalEleitores * 0.02),
      '18-24': Math.round(totalEleitores * 0.13),
      '25-34': Math.round(totalEleitores * 0.20),
      '35-44': Math.round(totalEleitores * 0.21),
      '45-59': Math.round(totalEleitores * 0.23),
      '60-69': Math.round(totalEleitores * 0.13),
      '70+': Math.round(totalEleitores * 0.08)
    },
    escolaridade: {
      analfabeto: Math.round(totalEleitores * 0.03),
      fundamental: Math.round(totalEleitores * 0.19),
      medio: Math.round(totalEleitores * 0.40),
      superior: Math.round(totalEleitores * 0.38)
    }
  };

  const demoBairros = municipios.slice(0, 20).map((m, i) => ({
    id: i + 1,
    nome: m.nome,
    latitude: -8.76 + (Math.random() * 0.5 - 0.25),
    longitude: -63.90 + (Math.random() * 0.5 - 0.25),
    totalEleitores: m.total_eleitores,
    votosNulos: Math.round(m.total_eleitores * 0.03),
    votosBrancos: Math.round(m.total_eleitores * 0.02)
  }));

  // Partidos mais votados (simulação baseada em dados reais)
  const demoResultados = {
    partidos: [
      { sigla: 'UNIÃO', votos: Math.round(totalEleitores * 0.18), cor: '#0099CC' },
      { sigla: 'PL', votos: Math.round(totalEleitores * 0.16), cor: '#0000FF' },
      { sigla: 'MDB', votos: Math.round(totalEleitores * 0.14), cor: '#00FF00' },
      { sigla: 'PP', votos: Math.round(totalEleitores * 0.12), cor: '#003366' },
      { sigla: 'PSD', votos: Math.round(totalEleitores * 0.10), cor: '#FF6600' },
      { sigla: 'REPUBLICANOS', votos: Math.round(totalEleitores * 0.08), cor: '#00CC00' },
      { sigla: 'PT', votos: Math.round(totalEleitores * 0.07), cor: '#FF0000' },
      { sigla: 'PDT', votos: Math.round(totalEleitores * 0.05), cor: '#FF3300' }
    ]
  };

  // Salvar arquivos de demonstração
  const outputDir = '/home/ubuntu/dte-system/data';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'demo_eleitorado.json'),
    JSON.stringify(demoEleitorado, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'demo_bairros.json'),
    JSON.stringify(demoBairros, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'demo_resultados.json'),
    JSON.stringify(demoResultados, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'municipios_ro.json'),
    JSON.stringify(municipios, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log('ARQUIVOS GERADOS:');
  console.log('='.repeat(60));
  console.log(`- ${outputDir}/demo_eleitorado.json`);
  console.log(`- ${outputDir}/demo_bairros.json`);
  console.log(`- ${outputDir}/demo_resultados.json`);
  console.log(`- ${outputDir}/municipios_ro.json`);

  console.log('\n' + '='.repeat(60));
  console.log('ESTATÍSTICAS FINAIS - RONDÔNIA 2024');
  console.log('='.repeat(60));
  console.log(`Total de Eleitores: ${totalEleitores.toLocaleString()}`);
  console.log(`  - Masculino: ${totalMasculino.toLocaleString()} (${(totalMasculino/totalEleitores*100).toFixed(1)}%)`);
  console.log(`  - Feminino: ${totalFeminino.toLocaleString()} (${(totalFeminino/totalEleitores*100).toFixed(1)}%)`);
  console.log(`Municípios: ${municipios.length}`);
  console.log(`Zonas Eleitorais: ${data.eleitorado.length}`);
  console.log(`Candidatos (2020-2024): ${data.totais.candidatos_2020 + data.totais.candidatos_2022 + data.totais.candidatos_2024}`);
  console.log(`Coligações (2020-2024): ${data.totais.coligacoes_2020 + data.totais.coligacoes_2022 + data.totais.coligacoes_2024}`);
}

main().catch(console.error);
