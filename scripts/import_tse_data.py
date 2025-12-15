#!/usr/bin/env python3
"""
Script para importar dados do TSE para o banco de dados DTE
Suporta: eleitorado, candidatos, coligações, partidos
"""

import csv
import os
import sys
from datetime import datetime

# Diretório dos dados
DATA_DIR = "/home/ubuntu/tse-data"

def read_csv_latin1(filepath, delimiter=';'):
    """Lê arquivo CSV com encoding Latin-1"""
    data = []
    with open(filepath, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            # Limpar aspas dos valores
            clean_row = {k.strip('"'): v.strip('"') if isinstance(v, str) else v for k, v in row.items()}
            data.append(clean_row)
    return data

def process_eleitorado_ro():
    """Processa dados do eleitorado de Rondônia"""
    filepath = os.path.join(DATA_DIR, "perfil_eleitorado_2024_RO.csv")
    if not os.path.exists(filepath):
        print(f"Arquivo não encontrado: {filepath}")
        return []
    
    print(f"Lendo {filepath}...")
    data = read_csv_latin1(filepath)
    print(f"Total de registros: {len(data)}")
    
    # Agrupar por município e zona
    municipios = {}
    for row in data:
        mun = row.get('NM_MUNICIPIO', '')
        zona = row.get('NR_ZONA', '')
        key = f"{mun}_{zona}"
        
        if key not in municipios:
            municipios[key] = {
                'municipio': mun,
                'codigo_municipio': row.get('CD_MUNICIPIO', ''),
                'zona': zona,
                'total_eleitores': 0,
                'masculino': 0,
                'feminino': 0,
                'biometria': 0,
                'deficiencia': 0
            }
        
        qt = int(row.get('QT_ELEITORES_PERFIL', 0) or 0)
        municipios[key]['total_eleitores'] += qt
        
        genero = row.get('DS_GENERO', '')
        if 'MASCULINO' in genero.upper():
            municipios[key]['masculino'] += qt
        elif 'FEMININO' in genero.upper():
            municipios[key]['feminino'] += qt
        
        municipios[key]['biometria'] += int(row.get('QT_ELEITORES_BIOMETRIA', 0) or 0)
        municipios[key]['deficiencia'] += int(row.get('QT_ELEITORES_DEFICIENCIA', 0) or 0)
    
    return list(municipios.values())

def process_candidatos_ro(ano=2024):
    """Processa dados de candidatos de Rondônia"""
    filepath = os.path.join(DATA_DIR, f"consulta_cand_{ano}_RO.csv")
    if not os.path.exists(filepath):
        print(f"Arquivo não encontrado: {filepath}")
        return []
    
    print(f"Lendo {filepath}...")
    data = read_csv_latin1(filepath)
    print(f"Total de registros: {len(data)}")
    
    candidatos = []
    for row in data:
        candidatos.append({
            'ano_eleicao': ano,
            'tipo_eleicao': row.get('NM_TIPO_ELEICAO', ''),
            'turno': row.get('NR_TURNO', 1),
            'uf': 'RO',
            'municipio': row.get('NM_UE', ''),
            'cargo': row.get('DS_CARGO', ''),
            'numero': row.get('NR_CANDIDATO', ''),
            'nome': row.get('NM_CANDIDATO', ''),
            'nome_urna': row.get('NM_URNA_CANDIDATO', ''),
            'partido_sigla': row.get('SG_PARTIDO', ''),
            'partido_nome': row.get('NM_PARTIDO', ''),
            'coligacao': row.get('NM_COLIGACAO', ''),
            'situacao': row.get('DS_SITUACAO_CANDIDATURA', ''),
            'resultado': row.get('DS_SIT_TOT_TURNO', ''),
            'genero': row.get('DS_GENERO', ''),
            'escolaridade': row.get('DS_GRAU_INSTRUCAO', ''),
            'cor_raca': row.get('DS_COR_RACA', ''),
            'ocupacao': row.get('DS_OCUPACAO', '')
        })
    
    return candidatos

def process_coligacoes_ro(ano=2024):
    """Processa dados de coligações de Rondônia"""
    filepath = os.path.join(DATA_DIR, f"consulta_coligacao_{ano}_RO.csv")
    if not os.path.exists(filepath):
        print(f"Arquivo não encontrado: {filepath}")
        return []
    
    print(f"Lendo {filepath}...")
    data = read_csv_latin1(filepath)
    print(f"Total de registros: {len(data)}")
    
    coligacoes = []
    for row in data:
        coligacoes.append({
            'ano_eleicao': ano,
            'tipo_eleicao': row.get('NM_TIPO_ELEICAO', ''),
            'turno': row.get('NR_TURNO', 1),
            'uf': 'RO',
            'municipio': row.get('NM_UE', ''),
            'cargo': row.get('DS_CARGO', ''),
            'tipo_agremiacao': row.get('TP_AGREMIACAO', ''),
            'sequencial': row.get('SQ_COLIGACAO', ''),
            'nome': row.get('NM_COLIGACAO', ''),
            'composicao': row.get('DS_COMPOSICAO_COLIGACAO', ''),
            'situacao': row.get('ST_COLIGACAO', '')
        })
    
    return coligacoes

def generate_sql_insert(table, data, batch_size=100):
    """Gera comandos SQL INSERT para os dados"""
    if not data:
        return []
    
    columns = list(data[0].keys())
    sql_statements = []
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        values_list = []
        
        for row in batch:
            values = []
            for col in columns:
                val = row.get(col, '')
                if val is None or val == '':
                    values.append('NULL')
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                else:
                    # Escapar aspas simples
                    val_escaped = str(val).replace("'", "''")
                    values.append(f"'{val_escaped}'")
            values_list.append(f"({', '.join(values)})")
        
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n" + ",\n".join(values_list) + ";"
        sql_statements.append(sql)
    
    return sql_statements

def main():
    print("=" * 60)
    print("IMPORTAÇÃO DE DADOS TSE - RONDÔNIA")
    print("=" * 60)
    
    # Processar eleitorado
    print("\n[1/3] Processando ELEITORADO...")
    eleitorado = process_eleitorado_ro()
    print(f"Municípios/Zonas processados: {len(eleitorado)}")
    
    # Calcular totais
    total_eleitores = sum(m['total_eleitores'] for m in eleitorado)
    total_masculino = sum(m['masculino'] for m in eleitorado)
    total_feminino = sum(m['feminino'] for m in eleitorado)
    print(f"Total de eleitores RO: {total_eleitores:,}")
    print(f"  - Masculino: {total_masculino:,}")
    print(f"  - Feminino: {total_feminino:,}")
    
    # Processar candidatos
    print("\n[2/3] Processando CANDIDATOS...")
    candidatos_2024 = process_candidatos_ro(2024)
    candidatos_2022 = process_candidatos_ro(2022)
    candidatos_2020 = process_candidatos_ro(2020)
    print(f"Candidatos 2024: {len(candidatos_2024)}")
    print(f"Candidatos 2022: {len(candidatos_2022)}")
    print(f"Candidatos 2020: {len(candidatos_2020)}")
    
    # Processar coligações
    print("\n[3/3] Processando COLIGAÇÕES...")
    coligacoes_2024 = process_coligacoes_ro(2024)
    coligacoes_2022 = process_coligacoes_ro(2022)
    coligacoes_2020 = process_coligacoes_ro(2020)
    print(f"Coligações 2024: {len(coligacoes_2024)}")
    print(f"Coligações 2022: {len(coligacoes_2022)}")
    print(f"Coligações 2020: {len(coligacoes_2020)}")
    
    # Resumo
    print("\n" + "=" * 60)
    print("RESUMO DA IMPORTAÇÃO")
    print("=" * 60)
    print(f"Eleitorado RO 2024: {total_eleitores:,} eleitores em {len(eleitorado)} zonas/municípios")
    print(f"Candidatos: {len(candidatos_2024) + len(candidatos_2022) + len(candidatos_2020)} registros")
    print(f"Coligações: {len(coligacoes_2024) + len(coligacoes_2022) + len(coligacoes_2020)} registros")
    
    # Salvar dados processados em JSON para uso posterior
    import json
    
    output = {
        'eleitorado': eleitorado,
        'candidatos_2024': candidatos_2024[:100],  # Amostra
        'candidatos_2022': candidatos_2022[:100],
        'candidatos_2020': candidatos_2020[:100],
        'coligacoes_2024': coligacoes_2024[:100],
        'coligacoes_2022': coligacoes_2022[:100],
        'coligacoes_2020': coligacoes_2020[:100],
        'totais': {
            'eleitores': total_eleitores,
            'masculino': total_masculino,
            'feminino': total_feminino,
            'candidatos_2024': len(candidatos_2024),
            'candidatos_2022': len(candidatos_2022),
            'candidatos_2020': len(candidatos_2020),
            'coligacoes_2024': len(coligacoes_2024),
            'coligacoes_2022': len(coligacoes_2022),
            'coligacoes_2020': len(coligacoes_2020)
        }
    }
    
    with open('/home/ubuntu/tse-data/dados_processados_ro.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\nDados salvos em: /home/ubuntu/tse-data/dados_processados_ro.json")
    
    return output

if __name__ == "__main__":
    main()
