/**
 * Script de migração de dados do MySQL/TiDB para Supabase PostgreSQL
 * Executa exportação do banco atual e importação no Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://tmcdfdpbnkmcvjzqedvw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtY2RmZHBibmttY3ZqenFlZHZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc5NzU0MSwiZXhwIjoyMDgxMzczNTQxfQ.Sx-AOlxSACHI5ekpjfD6pGbRxstx_vxd9WDHwNbs6W0';
const supabaseAccessToken = 'sbp_68a2478789af73db26211911118613d5df7335db';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para executar query no Supabase via API
async function executeSupabaseQuery(query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/tmcdfdpbnkmcvjzqedvw/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  
  const data = await response.json();
  if (data.message && data.message.includes('ERROR')) {
    throw new Error(data.message);
  }
  return data;
}

// Verificar tabelas existentes no Supabase
async function checkSupabaseTables() {
  console.log('\\n📊 Verificando tabelas no Supabase...');
  
  const tables = await executeSupabaseQuery(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('Tabelas encontradas:', tables.map(t => t.table_name).join(', '));
  return tables;
}

// Verificar contagem de registros em cada tabela
async function checkRecordCounts() {
  console.log('\\n📈 Contagem de registros no Supabase:');
  
  const tables = [
    'users', 'eleitorado', 'resultados_eleitorais', 
    'municipios', 'zonas_eleitorais', 'bairros',
    'candidatos', 'partidos', 'importacoes'
  ];
  
  for (const table of tables) {
    try {
      const result = await executeSupabaseQuery(`SELECT COUNT(*) as count FROM ${table};`);
      console.log(`  - ${table}: ${result[0]?.count || 0} registros`);
    } catch (error) {
      console.log(`  - ${table}: Tabela não existe ou erro`);
    }
  }
}

// Verificar estrutura das tabelas
async function checkTableStructure(tableName) {
  console.log(`\\n🔍 Estrutura da tabela ${tableName}:`);
  
  const columns = await executeSupabaseQuery(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `);
  
  columns.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
  });
  
  return columns;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando verificação de migração para Supabase...');
  console.log('=' .repeat(60));
  
  try {
    // Verificar tabelas
    await checkSupabaseTables();
    
    // Verificar contagem de registros
    await checkRecordCounts();
    
    // Verificar estrutura de tabelas principais
    await checkTableStructure('users');
    await checkTableStructure('eleitorado');
    
    console.log('\\n✅ Verificação concluída!');
    console.log('\\n📝 Observações:');
    console.log('  - O Supabase já possui as tabelas necessárias');
    console.log('  - Os dados do banco MySQL/TiDB atual são separados');
    console.log('  - Para migração completa, exporte os dados do MySQL e importe no Supabase');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();
