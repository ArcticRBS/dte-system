#!/usr/bin/env python3
"""
Script para popular o banco de dados DTE com dados do TSE de Rondônia
"""

import csv
import json
import os
import mysql.connector
from datetime import datetime

# Configuração do banco de dados
DB_CONFIG = {
    'host': 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    'port': 4000,
    'user': '2xR5rJb6K3iXYRB.root',
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': 'dte_system',
    'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',
    'ssl_verify_cert': True
}

DATA_DIR = "/home/ubuntu/tse-data"

def read_csv_latin1(filepath, delimiter=';'):
    """Lê arquivo CSV com encoding Latin-1"""
    data = []
    with open(filepath, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            clean_row = {k.strip('"'): v.strip('"') if isinstance(v, str) else v for k, v in row.items()}
            data.append(clean_row)
    return data

def get_connection():
    """Conecta ao banco de dados"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Erro ao conectar: {e}")
        return None

def insert_municipios(conn, data):
    """Insere municípios de Rondônia"""
    cursor = conn.cursor()
    
    # Primeiro, criar a região RO se não existir
    cursor.execute("""
        INSERT IGNORE INTO regioes (nome, codigo, uf) 
        VALUES ('Rondônia', 'RO', 'RO')
    """)
    cursor.execute("SELECT id FROM regioes WHERE uf = 'RO' LIMIT 1")
    regiao_id = cursor.fetchone()[0]
    
    # Extrair municípios únicos
    municipios = {}
    for row in data:
        cod = row.get('CD_MUNICIPIO', '')
        nome = row.get('NM_MUNICIPIO', '')
        if cod and nome and cod not in municipios:
            municipios[cod] = nome
    
    # Inserir municípios
    for cod, nome in municipios.items():
        cursor.execute("""
            INSERT IGNORE INTO municipios (nome, codigo, codigoTse, regiaoId, uf)
            VALUES (%s, %s, %s, %s, 'RO')
        """, (nome, cod, cod, regiao_id))
    
    conn.commit()
    print(f"Inseridos {len(municipios)} municípios")
    return municipios

def insert_zonas(conn, data):
    """Insere zonas eleitorais"""
    cursor = conn.cursor()
    
    # Extrair zonas únicas por município
    zonas = {}
    for row in data:
        zona = row.get('NR_ZONA', '')
        mun_cod = row.get('CD_MUNICIPIO', '')
        if zona and mun_cod:
            key = f"{mun_cod}_{zona}"
            if key not in zonas:
                zonas[key] = {'numero': int(zona), 'municipio_cod': mun_cod}
    
    # Buscar IDs dos municípios
    cursor.execute("SELECT id, codigo FROM municipios WHERE uf = 'RO'")
    mun_map = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Inserir zonas
    inserted = 0
    for key, z in zonas.items():
        mun_id = mun_map.get(z['municipio_cod'])
        if mun_id:
            cursor.execute("""
                INSERT IGNORE INTO zonas_eleitorais (numero, municipioId)
                VALUES (%s, %s)
            """, (z['numero'], mun_id))
            inserted += 1
    
    conn.commit()
    print(f"Inseridas {inserted} zonas eleitorais")

def insert_eleitorado(conn, data):
    """Insere dados do eleitorado agregados por zona"""
    cursor = conn.cursor()
    
    # Buscar mapeamentos
    cursor.execute("SELECT id, codigo FROM municipios WHERE uf = 'RO'")
    mun_map = {row[1]: row[0] for row in cursor.fetchall()}
    
    cursor.execute("SELECT id, numero, municipioId FROM zonas_eleitorais")
    zona_map = {(row[1], row[2]): row[0] for row in cursor.fetchall()}
    
    # Agregar dados por zona
    zonas_data = {}
    for row in data:
        mun_cod = row.get('CD_MUNICIPIO', '')
        zona_num = int(row.get('NR_ZONA', 0) or 0)
        mun_id = mun_map.get(mun_cod)
        
        if not mun_id:
            continue
            
        zona_id = zona_map.get((zona_num, mun_id))
        key = f"{mun_id}_{zona_num}"
        
        if key not in zonas_data:
            zonas_data[key] = {
                'municipioId': mun_id,
                'zonaId': zona_id,
                'totalEleitores': 0,
                'masculino': 0,
                'feminino': 0,
                'outros': 0,
                'faixa16a17': 0,
                'faixa18a24': 0,
                'faixa25a34': 0,
                'faixa35a44': 0,
                'faixa45a59': 0,
                'faixa60a69': 0,
                'faixa70mais': 0,
                'analfabeto': 0,
                'fundamental': 0,
                'medio': 0,
                'superior': 0
            }
        
        qt = int(row.get('QT_ELEITORES_PERFIL', 0) or 0)
        zonas_data[key]['totalEleitores'] += qt
        
        # Gênero
        genero = row.get('DS_GENERO', '').upper()
        if 'MASCULINO' in genero:
            zonas_data[key]['masculino'] += qt
        elif 'FEMININO' in genero:
            zonas_data[key]['feminino'] += qt
        else:
            zonas_data[key]['outros'] += qt
        
        # Faixa etária
        faixa = row.get('DS_FAIXA_ETARIA', '')
        if '16' in faixa or '17' in faixa:
            zonas_data[key]['faixa16a17'] += qt
        elif '18' in faixa or '19' in faixa or '20' in faixa or '21' in faixa or '22' in faixa or '23' in faixa or '24' in faixa:
            zonas_data[key]['faixa18a24'] += qt
        elif '25' in faixa or '26' in faixa or '27' in faixa or '28' in faixa or '29' in faixa or '30' in faixa or '31' in faixa or '32' in faixa or '33' in faixa or '34' in faixa:
            zonas_data[key]['faixa25a34'] += qt
        elif '35' in faixa or '36' in faixa or '37' in faixa or '38' in faixa or '39' in faixa or '40' in faixa or '41' in faixa or '42' in faixa or '43' in faixa or '44' in faixa:
            zonas_data[key]['faixa35a44'] += qt
        elif '45' in faixa or '46' in faixa or '47' in faixa or '48' in faixa or '49' in faixa or '50' in faixa or '51' in faixa or '52' in faixa or '53' in faixa or '54' in faixa or '55' in faixa or '56' in faixa or '57' in faixa or '58' in faixa or '59' in faixa:
            zonas_data[key]['faixa45a59'] += qt
        elif '60' in faixa or '61' in faixa or '62' in faixa or '63' in faixa or '64' in faixa or '65' in faixa or '66' in faixa or '67' in faixa or '68' in faixa or '69' in faixa:
            zonas_data[key]['faixa60a69'] += qt
        elif '70' in faixa or '71' in faixa or '72' in faixa or '73' in faixa or '74' in faixa or '75' in faixa or '76' in faixa or '77' in faixa or '78' in faixa or '79' in faixa or '80' in faixa or '81' in faixa or '82' in faixa or '83' in faixa or '84' in faixa or '85' in faixa or '86' in faixa or '87' in faixa or '88' in faixa or '89' in faixa or '90' in faixa or '100' in faixa:
            zonas_data[key]['faixa70mais'] += qt
        
        # Escolaridade
        escol = row.get('DS_GRAU_ESCOLARIDADE', '').upper()
        if 'ANALFABETO' in escol or 'LÊ E ESCREVE' in escol:
            zonas_data[key]['analfabeto'] += qt
        elif 'FUNDAMENTAL' in escol:
            zonas_data[key]['fundamental'] += qt
        elif 'MÉDIO' in escol or 'MEDIO' in escol:
            zonas_data[key]['medio'] += qt
        elif 'SUPERIOR' in escol:
            zonas_data[key]['superior'] += qt
    
    # Inserir dados
    inserted = 0
    for key, z in zonas_data.items():
        cursor.execute("""
            INSERT INTO eleitorado (
                anoEleicao, municipioId, zonaId, totalEleitores,
                eleitoresMasculino, eleitoresFeminino, eleitoresOutros,
                faixa16a17, faixa18a24, faixa25a34, faixa35a44, faixa45a59, faixa60a69, faixa70mais,
                escolaridadeAnalfabeto, escolaridadeFundamental, escolaridadeMedio, escolaridadeSuperior
            ) VALUES (
                2024, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            z['municipioId'], z['zonaId'], z['totalEleitores'],
            z['masculino'], z['feminino'], z['outros'],
            z['faixa16a17'], z['faixa18a24'], z['faixa25a34'], z['faixa35a44'],
            z['faixa45a59'], z['faixa60a69'], z['faixa70mais'],
            z['analfabeto'], z['fundamental'], z['medio'], z['superior']
        ))
        inserted += 1
    
    conn.commit()
    print(f"Inseridos {inserted} registros de eleitorado")

def insert_partidos(conn):
    """Insere partidos políticos"""
    cursor = conn.cursor()
    
    partidos = [
        ('PT', 'Partido dos Trabalhadores', 13, '#FF0000'),
        ('PL', 'Partido Liberal', 22, '#0000FF'),
        ('MDB', 'Movimento Democrático Brasileiro', 15, '#00FF00'),
        ('PSDB', 'Partido da Social Democracia Brasileira', 45, '#0066CC'),
        ('PP', 'Progressistas', 11, '#003366'),
        ('PSD', 'Partido Social Democrático', 55, '#FF6600'),
        ('UNIÃO', 'União Brasil', 44, '#0099CC'),
        ('REPUBLICANOS', 'Republicanos', 10, '#00CC00'),
        ('PDT', 'Partido Democrático Trabalhista', 12, '#FF3300'),
        ('PSB', 'Partido Socialista Brasileiro', 40, '#FF9900'),
        ('PODEMOS', 'Podemos', 20, '#6600CC'),
        ('PSOL', 'Partido Socialismo e Liberdade', 50, '#990000'),
        ('PCdoB', 'Partido Comunista do Brasil', 65, '#CC0000'),
        ('PV', 'Partido Verde', 43, '#009900'),
        ('CIDADANIA', 'Cidadania', 23, '#FF6699'),
        ('SOLIDARIEDADE', 'Solidariedade', 77, '#FF9933'),
        ('AVANTE', 'Avante', 70, '#003399'),
        ('NOVO', 'Partido Novo', 30, '#FF6600'),
        ('REDE', 'Rede Sustentabilidade', 18, '#00CC66'),
        ('AGIR', 'Agir', 36, '#9933FF'),
    ]
    
    for sigla, nome, numero, cor in partidos:
        cursor.execute("""
            INSERT IGNORE INTO partidos (sigla, nome, numero, cor)
            VALUES (%s, %s, %s, %s)
        """, (sigla, nome, numero, cor))
    
    conn.commit()
    print(f"Inseridos {len(partidos)} partidos")

def main():
    print("=" * 60)
    print("POPULANDO BANCO DE DADOS DTE COM DADOS DO TSE")
    print("=" * 60)
    
    # Ler dados do eleitorado
    filepath = os.path.join(DATA_DIR, "perfil_eleitorado_2024_RO.csv")
    if not os.path.exists(filepath):
        print(f"Arquivo não encontrado: {filepath}")
        return
    
    print(f"\nLendo {filepath}...")
    data = read_csv_latin1(filepath)
    print(f"Total de registros: {len(data)}")
    
    # Conectar ao banco
    print("\nConectando ao banco de dados...")
    conn = get_connection()
    if not conn:
        print("Falha na conexão. Verifique as credenciais.")
        return
    
    try:
        # Inserir dados
        print("\n[1/4] Inserindo municípios...")
        insert_municipios(conn, data)
        
        print("\n[2/4] Inserindo zonas eleitorais...")
        insert_zonas(conn, data)
        
        print("\n[3/4] Inserindo partidos...")
        insert_partidos(conn)
        
        print("\n[4/4] Inserindo dados do eleitorado...")
        insert_eleitorado(conn, data)
        
        print("\n" + "=" * 60)
        print("IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Erro durante a importação: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
