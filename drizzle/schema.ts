import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint, boolean, json } from "drizzle-orm/mysql-core";

// ==================== USUÁRIOS E AUTENTICAÇÃO ====================

export const userRoles = ["admin", "gestor", "politico", "demo"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "gestor", "politico", "demo"]).default("demo").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== CONFIGURAÇÕES DO SISTEMA ====================

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== DADOS GEOGRÁFICOS ====================

export const regioes = mysqlTable("regioes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  uf: varchar("uf", { length: 2 }).default("RO"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const municipios = mysqlTable("municipios", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  codigoTse: varchar("codigoTse", { length: 10 }),
  regiaoId: int("regiaoId").references(() => regioes.id),
  uf: varchar("uf", { length: 2 }).default("RO"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bairros = mysqlTable("bairros", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  municipioId: int("municipioId").references(() => municipios.id),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const zonasEleitorais = mysqlTable("zonas_eleitorais", {
  id: int("id").autoincrement().primaryKey(),
  numero: int("numero").notNull(),
  nome: varchar("nome", { length: 100 }),
  municipioId: int("municipioId").references(() => municipios.id),
  endereco: text("endereco"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const secoesEleitorais = mysqlTable("secoes_eleitorais", {
  id: int("id").autoincrement().primaryKey(),
  numero: int("numero").notNull(),
  zonaId: int("zonaId").references(() => zonasEleitorais.id),
  localVotacao: text("localVotacao"),
  bairroId: int("bairroId").references(() => bairros.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== ELEITORADO TSE ====================

export const eleitorado = mysqlTable("eleitorado", {
  id: int("id").autoincrement().primaryKey(),
  anoEleicao: int("anoEleicao").notNull(),
  municipioId: int("municipioId").references(() => municipios.id),
  bairroId: int("bairroId").references(() => bairros.id),
  zonaId: int("zonaId").references(() => zonasEleitorais.id),
  secaoId: int("secaoId").references(() => secoesEleitorais.id),
  totalEleitores: int("totalEleitores").default(0),
  eleitoresMasculino: int("eleitoresMasculino").default(0),
  eleitoresFeminino: int("eleitoresFeminino").default(0),
  eleitoresOutros: int("eleitoresOutros").default(0),
  faixa16a17: int("faixa16a17").default(0),
  faixa18a24: int("faixa18a24").default(0),
  faixa25a34: int("faixa25a34").default(0),
  faixa35a44: int("faixa35a44").default(0),
  faixa45a59: int("faixa45a59").default(0),
  faixa60a69: int("faixa60a69").default(0),
  faixa70mais: int("faixa70mais").default(0),
  escolaridadeAnalfabeto: int("escolaridadeAnalfabeto").default(0),
  escolaridadeFundamental: int("escolaridadeFundamental").default(0),
  escolaridadeMedio: int("escolaridadeMedio").default(0),
  escolaridadeSuperior: int("escolaridadeSuperior").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela detalhada de eleitores do TSE (perfil_eleitorado)
export const eleitoradoTse = mysqlTable("eleitorado_tse", {
  id: int("id").autoincrement().primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: int("anoEleicao").notNull(),
  sgUf: varchar("sgUf", { length: 2 }).default("RO"),
  cdMunicipio: varchar("cdMunicipio", { length: 10 }),
  nmMunicipio: varchar("nmMunicipio", { length: 100 }),
  cdMrc: varchar("cdMrc", { length: 10 }),
  nmMrc: varchar("nmMrc", { length: 100 }),
  nrZona: int("nrZona"),
  cdGenero: varchar("cdGenero", { length: 5 }),
  dsGenero: varchar("dsGenero", { length: 20 }),
  cdEstadoCivil: varchar("cdEstadoCivil", { length: 5 }),
  dsEstadoCivil: varchar("dsEstadoCivil", { length: 30 }),
  cdFaixaEtaria: varchar("cdFaixaEtaria", { length: 10 }),
  dsFaixaEtaria: varchar("dsFaixaEtaria", { length: 30 }),
  cdGrauEscolaridade: varchar("cdGrauEscolaridade", { length: 5 }),
  dsGrauEscolaridade: varchar("dsGrauEscolaridade", { length: 50 }),
  qtEleitoresPerfilBiometrico: int("qtEleitoresPerfilBiometrico").default(0),
  qtEleitoresPerfilDeficiencia: int("qtEleitoresPerfilDeficiencia").default(0),
  qtEleitoresPerfilNomeSocial: int("qtEleitoresPerfilNomeSocial").default(0),
  qtEleitoresPerfil: int("qtEleitoresPerfil").default(0),
  importacaoId: int("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== PARTIDOS TSE ====================

export const partidos = mysqlTable("partidos", {
  id: int("id").autoincrement().primaryKey(),
  sigla: varchar("sigla", { length: 20 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  numero: int("numero").notNull(),
  cor: varchar("cor", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabela detalhada de partidos do TSE
export const partidosTse = mysqlTable("partidos_tse", {
  id: int("id").autoincrement().primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: int("anoEleicao").notNull(),
  sgUf: varchar("sgUf", { length: 2 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  nrPartido: int("nrPartido"),
  sgPartido: varchar("sgPartido", { length: 20 }),
  nmPartido: varchar("nmPartido", { length: 200 }),
  sqPartido: varchar("sqPartido", { length: 20 }),
  nrCnpj: varchar("nrCnpj", { length: 20 }),
  dtCriacaoPartido: varchar("dtCriacaoPartido", { length: 20 }),
  dtRegistroTse: varchar("dtRegistroTse", { length: 20 }),
  dtExtincaoPartido: varchar("dtExtincaoPartido", { length: 20 }),
  importacaoId: int("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== COLIGAÇÕES TSE ====================

export const coligacoesTse = mysqlTable("coligacoes_tse", {
  id: int("id").autoincrement().primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: int("anoEleicao").notNull(),
  cdTipoEleicao: varchar("cdTipoEleicao", { length: 10 }),
  nmTipoEleicao: varchar("nmTipoEleicao", { length: 50 }),
  nrTurno: int("nrTurno").default(1),
  cdEleicao: varchar("cdEleicao", { length: 20 }),
  dsEleicao: varchar("dsEleicao", { length: 100 }),
  sgUf: varchar("sgUf", { length: 2 }),
  sgUe: varchar("sgUe", { length: 10 }),
  nmUe: varchar("nmUe", { length: 100 }),
  cdCargo: varchar("cdCargo", { length: 10 }),
  dsCargo: varchar("dsCargo", { length: 50 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  sqColigacao: varchar("sqColigacao", { length: 20 }),
  nmColigacao: varchar("nmColigacao", { length: 200 }),
  dsComposicaoColigacao: text("dsComposicaoColigacao"),
  stColigacao: varchar("stColigacao", { length: 20 }),
  importacaoId: int("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== CANDIDATOS TSE ====================

export const candidatos = mysqlTable("candidatos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  nomeUrna: varchar("nomeUrna", { length: 100 }),
  numero: int("numero").notNull(),
  partidoId: int("partidoId").references(() => partidos.id),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  anoEleicao: int("anoEleicao").notNull(),
  municipioId: int("municipioId").references(() => municipios.id),
  situacao: varchar("situacao", { length: 50 }),
  foto: text("foto"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabela detalhada de candidatos do TSE
export const candidatosTse = mysqlTable("candidatos_tse", {
  id: int("id").autoincrement().primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: int("anoEleicao").notNull(),
  cdTipoEleicao: varchar("cdTipoEleicao", { length: 10 }),
  nmTipoEleicao: varchar("nmTipoEleicao", { length: 50 }),
  nrTurno: int("nrTurno").default(1),
  cdEleicao: varchar("cdEleicao", { length: 20 }),
  dsEleicao: varchar("dsEleicao", { length: 100 }),
  sgUf: varchar("sgUf", { length: 2 }),
  sgUe: varchar("sgUe", { length: 10 }),
  nmUe: varchar("nmUe", { length: 100 }),
  cdCargo: varchar("cdCargo", { length: 10 }),
  dsCargo: varchar("dsCargo", { length: 50 }),
  sqCandidato: varchar("sqCandidato", { length: 20 }),
  nrCandidato: int("nrCandidato"),
  nmCandidato: varchar("nmCandidato", { length: 200 }),
  nmUrna: varchar("nmUrna", { length: 100 }),
  nmSocial: varchar("nmSocial", { length: 200 }),
  nrCpf: varchar("nrCpf", { length: 15 }),
  nmEmail: varchar("nmEmail", { length: 200 }),
  cdSituacaoCandidatura: varchar("cdSituacaoCandidatura", { length: 10 }),
  dsSituacaoCandidatura: varchar("dsSituacaoCandidatura", { length: 50 }),
  cdDetalhesSituacaoCand: varchar("cdDetalhesSituacaoCand", { length: 10 }),
  dsDetalhesSituacaoCand: varchar("dsDetalhesSituacaoCand", { length: 100 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  nrPartido: int("nrPartido"),
  sgPartido: varchar("sgPartido", { length: 20 }),
  nmPartido: varchar("nmPartido", { length: 200 }),
  sqColigacao: varchar("sqColigacao", { length: 20 }),
  nmColigacao: varchar("nmColigacao", { length: 200 }),
  dsComposicaoColigacao: text("dsComposicaoColigacao"),
  cdNacionalidade: varchar("cdNacionalidade", { length: 10 }),
  dsNacionalidade: varchar("dsNacionalidade", { length: 50 }),
  sgUfNascimento: varchar("sgUfNascimento", { length: 2 }),
  cdMunicipioNascimento: varchar("cdMunicipioNascimento", { length: 10 }),
  nmMunicipioNascimento: varchar("nmMunicipioNascimento", { length: 100 }),
  dtNascimento: varchar("dtNascimento", { length: 20 }),
  nrIdadeDataPosse: int("nrIdadeDataPosse"),
  nrTituloEleitoral: varchar("nrTituloEleitoral", { length: 20 }),
  cdGenero: varchar("cdGenero", { length: 5 }),
  dsGenero: varchar("dsGenero", { length: 20 }),
  cdGrauInstrucao: varchar("cdGrauInstrucao", { length: 5 }),
  dsGrauInstrucao: varchar("dsGrauInstrucao", { length: 50 }),
  cdEstadoCivil: varchar("cdEstadoCivil", { length: 5 }),
  dsEstadoCivil: varchar("dsEstadoCivil", { length: 30 }),
  cdCorRaca: varchar("cdCorRaca", { length: 5 }),
  dsCorRaca: varchar("dsCorRaca", { length: 30 }),
  cdOcupacao: varchar("cdOcupacao", { length: 10 }),
  dsOcupacao: varchar("dsOcupacao", { length: 100 }),
  vrDespesaMaxCampanha: decimal("vrDespesaMaxCampanha", { precision: 15, scale: 2 }),
  cdSitTotTurno: varchar("cdSitTotTurno", { length: 10 }),
  dsSitTotTurno: varchar("dsSitTotTurno", { length: 50 }),
  stReeleicao: varchar("stReeleicao", { length: 5 }),
  stDeclaraBens: varchar("stDeclaraBens", { length: 5 }),
  nrProtocoloCandidatura: varchar("nrProtocoloCandidatura", { length: 30 }),
  nrProcesso: varchar("nrProcesso", { length: 30 }),
  importacaoId: int("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== RESULTADOS ELEITORAIS ====================

export const resultadosEleitorais = mysqlTable("resultados_eleitorais", {
  id: int("id").autoincrement().primaryKey(),
  anoEleicao: int("anoEleicao").notNull(),
  turno: int("turno").default(1),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  municipioId: int("municipioId").references(() => municipios.id),
  bairroId: int("bairroId").references(() => bairros.id),
  zonaId: int("zonaId").references(() => zonasEleitorais.id),
  secaoId: int("secaoId").references(() => secoesEleitorais.id),
  candidatoId: int("candidatoId").references(() => candidatos.id),
  partidoId: int("partidoId").references(() => partidos.id),
  votosValidos: int("votosValidos").default(0),
  votosNominais: int("votosNominais").default(0),
  votosLegenda: int("votosLegenda").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== VOTOS NULOS E BRANCOS ====================

export const votosNulosBrancos = mysqlTable("votos_nulos_brancos", {
  id: int("id").autoincrement().primaryKey(),
  anoEleicao: int("anoEleicao").notNull(),
  turno: int("turno").default(1),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  municipioId: int("municipioId").references(() => municipios.id),
  bairroId: int("bairroId").references(() => bairros.id),
  zonaId: int("zonaId").references(() => zonasEleitorais.id),
  secaoId: int("secaoId").references(() => secoesEleitorais.id),
  votosNulos: int("votosNulos").default(0),
  votosBrancos: int("votosBrancos").default(0),
  abstencoes: int("abstencoes").default(0),
  totalAptos: int("totalAptos").default(0),
  comparecimento: int("comparecimento").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== IMPORTAÇÕES ====================

export const importacoes = mysqlTable("importacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  tipoArquivo: varchar("tipoArquivo", { length: 50 }).notNull(),
  tipoDataset: mysqlEnum("tipoDataset", [
    "eleitorado",
    "candidatos", 
    "partidos",
    "coligacoes",
    "resultados",
    "votos_nulos_brancos"
  ]).notNull(),
  totalRegistros: int("totalRegistros").default(0),
  registrosImportados: int("registrosImportados").default(0),
  registrosErro: int("registrosErro").default(0),
  status: mysqlEnum("status", ["pendente", "processando", "concluido", "erro"]).default("pendente"),
  mensagemErro: text("mensagemErro"),
  anoReferencia: int("anoReferencia"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== LOGS DE AUDITORIA ====================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("tableName", { length: 100 }),
  recordId: int("recordId"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== DADOS DE DEMONSTRAÇÃO ====================

export const demoData = mysqlTable("demo_data", {
  id: int("id").autoincrement().primaryKey(),
  dataType: varchar("dataType", { length: 50 }).notNull(),
  dataContent: json("dataContent"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== TYPES ====================

export type Regiao = typeof regioes.$inferSelect;
export type Municipio = typeof municipios.$inferSelect;
export type Bairro = typeof bairros.$inferSelect;
export type ZonaEleitoral = typeof zonasEleitorais.$inferSelect;
export type SecaoEleitoral = typeof secoesEleitorais.$inferSelect;
export type Eleitorado = typeof eleitorado.$inferSelect;
export type EleitoradoTse = typeof eleitoradoTse.$inferSelect;
export type Partido = typeof partidos.$inferSelect;
export type PartidoTse = typeof partidosTse.$inferSelect;
export type ColigacaoTse = typeof coligacoesTse.$inferSelect;
export type Candidato = typeof candidatos.$inferSelect;
export type CandidatoTse = typeof candidatosTse.$inferSelect;
export type ResultadoEleitoral = typeof resultadosEleitorais.$inferSelect;
export type VotoNuloBranco = typeof votosNulosBrancos.$inferSelect;
export type Importacao = typeof importacoes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
