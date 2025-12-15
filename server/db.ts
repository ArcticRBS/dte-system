import { eq, and, desc, sql, gte, lte, sum, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  regioes,
  municipios,
  bairros,
  zonasEleitorais,
  secoesEleitorais,
  eleitorado,
  partidos,
  candidatos,
  resultadosEleitorais,
  votosNulosBrancos,
  importacoes,
  auditLogs,
  demoData,
  systemSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USUÁRIOS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "gestor" | "politico" | "demo") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, name: string, email?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: { name: string; email?: string } = { name };
  if (email) {
    updateData.email = email;
  }
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// ==================== REGIÕES E MUNICÍPIOS ====================

export async function getRegioes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(regioes).orderBy(regioes.nome);
}

export async function getMunicipios(regiaoId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (regiaoId) {
    return db.select().from(municipios).where(eq(municipios.regiaoId, regiaoId)).orderBy(municipios.nome);
  }
  return db.select().from(municipios).orderBy(municipios.nome);
}

export async function getBairros(municipioId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (municipioId) {
    return db.select().from(bairros).where(eq(bairros.municipioId, municipioId)).orderBy(bairros.nome);
  }
  return db.select().from(bairros).orderBy(bairros.nome);
}

export async function getZonasEleitorais(municipioId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (municipioId) {
    return db.select().from(zonasEleitorais).where(eq(zonasEleitorais.municipioId, municipioId)).orderBy(zonasEleitorais.numero);
  }
  return db.select().from(zonasEleitorais).orderBy(zonasEleitorais.numero);
}

// ==================== ELEITORADO ====================

export async function getEleitoradoStats(filters?: { anoEleicao?: number; municipioId?: number; bairroId?: number; zonaId?: number }) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [];
  if (filters?.anoEleicao) conditions.push(eq(eleitorado.anoEleicao, filters.anoEleicao));
  if (filters?.municipioId) conditions.push(eq(eleitorado.municipioId, filters.municipioId));
  if (filters?.bairroId) conditions.push(eq(eleitorado.bairroId, filters.bairroId));
  if (filters?.zonaId) conditions.push(eq(eleitorado.zonaId, filters.zonaId));

  const result = await db
    .select({
      totalEleitores: sum(eleitorado.totalEleitores),
      masculino: sum(eleitorado.eleitoresMasculino),
      feminino: sum(eleitorado.eleitoresFeminino),
      outros: sum(eleitorado.eleitoresOutros),
      faixa16a17: sum(eleitorado.faixa16a17),
      faixa18a24: sum(eleitorado.faixa18a24),
      faixa25a34: sum(eleitorado.faixa25a34),
      faixa35a44: sum(eleitorado.faixa35a44),
      faixa45a59: sum(eleitorado.faixa45a59),
      faixa60a69: sum(eleitorado.faixa60a69),
      faixa70mais: sum(eleitorado.faixa70mais),
      analfabeto: sum(eleitorado.escolaridadeAnalfabeto),
      fundamental: sum(eleitorado.escolaridadeFundamental),
      medio: sum(eleitorado.escolaridadeMedio),
      superior: sum(eleitorado.escolaridadeSuperior),
    })
    .from(eleitorado)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0];
}

export async function getEleitoradoPorBairro(anoEleicao: number, municipioId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(eleitorado.anoEleicao, anoEleicao)];
  if (municipioId) conditions.push(eq(eleitorado.municipioId, municipioId));

  return db
    .select({
      bairroId: eleitorado.bairroId,
      bairroNome: bairros.nome,
      latitude: bairros.latitude,
      longitude: bairros.longitude,
      totalEleitores: sum(eleitorado.totalEleitores),
    })
    .from(eleitorado)
    .leftJoin(bairros, eq(eleitorado.bairroId, bairros.id))
    .where(and(...conditions))
    .groupBy(eleitorado.bairroId, bairros.nome, bairros.latitude, bairros.longitude);
}

// ==================== PARTIDOS E CANDIDATOS ====================

export async function getPartidos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(partidos).orderBy(partidos.sigla);
}

export async function getCandidatos(filters?: { anoEleicao?: number; cargo?: string; partidoId?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.anoEleicao) conditions.push(eq(candidatos.anoEleicao, filters.anoEleicao));
  if (filters?.cargo) conditions.push(eq(candidatos.cargo, filters.cargo));
  if (filters?.partidoId) conditions.push(eq(candidatos.partidoId, filters.partidoId));

  return db
    .select({
      candidato: candidatos,
      partido: partidos,
    })
    .from(candidatos)
    .leftJoin(partidos, eq(candidatos.partidoId, partidos.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(candidatos.nome);
}

// ==================== RESULTADOS ELEITORAIS ====================

export async function getResultadosPorPartido(filters: { anoEleicao: number; cargo: string; municipioId?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(resultadosEleitorais.anoEleicao, filters.anoEleicao), eq(resultadosEleitorais.cargo, filters.cargo)];
  if (filters.municipioId) conditions.push(eq(resultadosEleitorais.municipioId, filters.municipioId));

  return db
    .select({
      partidoId: resultadosEleitorais.partidoId,
      partidoSigla: partidos.sigla,
      partidoNome: partidos.nome,
      partidoCor: partidos.cor,
      totalVotos: sum(resultadosEleitorais.votosValidos),
    })
    .from(resultadosEleitorais)
    .leftJoin(partidos, eq(resultadosEleitorais.partidoId, partidos.id))
    .where(and(...conditions))
    .groupBy(resultadosEleitorais.partidoId, partidos.sigla, partidos.nome, partidos.cor)
    .orderBy(desc(sum(resultadosEleitorais.votosValidos)));
}

export async function getResultadosPorCandidato(filters: { anoEleicao: number; cargo: string; municipioId?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(resultadosEleitorais.anoEleicao, filters.anoEleicao), eq(resultadosEleitorais.cargo, filters.cargo)];
  if (filters.municipioId) conditions.push(eq(resultadosEleitorais.municipioId, filters.municipioId));

  return db
    .select({
      candidatoId: resultadosEleitorais.candidatoId,
      candidatoNome: candidatos.nome,
      candidatoNomeUrna: candidatos.nomeUrna,
      candidatoNumero: candidatos.numero,
      partidoSigla: partidos.sigla,
      totalVotos: sum(resultadosEleitorais.votosValidos),
    })
    .from(resultadosEleitorais)
    .leftJoin(candidatos, eq(resultadosEleitorais.candidatoId, candidatos.id))
    .leftJoin(partidos, eq(candidatos.partidoId, partidos.id))
    .where(and(...conditions))
    .groupBy(resultadosEleitorais.candidatoId, candidatos.nome, candidatos.nomeUrna, candidatos.numero, partidos.sigla)
    .orderBy(desc(sum(resultadosEleitorais.votosValidos)));
}

export async function getComparacaoEleicoes(cargo: string, municipioId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(resultadosEleitorais.cargo, cargo)];
  if (municipioId) conditions.push(eq(resultadosEleitorais.municipioId, municipioId));

  return db
    .select({
      anoEleicao: resultadosEleitorais.anoEleicao,
      partidoSigla: partidos.sigla,
      totalVotos: sum(resultadosEleitorais.votosValidos),
    })
    .from(resultadosEleitorais)
    .leftJoin(partidos, eq(resultadosEleitorais.partidoId, partidos.id))
    .where(and(...conditions))
    .groupBy(resultadosEleitorais.anoEleicao, partidos.sigla)
    .orderBy(resultadosEleitorais.anoEleicao, desc(sum(resultadosEleitorais.votosValidos)));
}

// ==================== VOTOS NULOS E BRANCOS ====================

export async function getVotosNulosBrancosStats(filters?: { anoEleicao?: number; cargo?: string; municipioId?: number; bairroId?: number; zonaId?: number }) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [];
  if (filters?.anoEleicao) conditions.push(eq(votosNulosBrancos.anoEleicao, filters.anoEleicao));
  if (filters?.cargo) conditions.push(eq(votosNulosBrancos.cargo, filters.cargo));
  if (filters?.municipioId) conditions.push(eq(votosNulosBrancos.municipioId, filters.municipioId));
  if (filters?.bairroId) conditions.push(eq(votosNulosBrancos.bairroId, filters.bairroId));
  if (filters?.zonaId) conditions.push(eq(votosNulosBrancos.zonaId, filters.zonaId));

  const result = await db
    .select({
      totalNulos: sum(votosNulosBrancos.votosNulos),
      totalBrancos: sum(votosNulosBrancos.votosBrancos),
      totalAbstencoes: sum(votosNulosBrancos.abstencoes),
      totalAptos: sum(votosNulosBrancos.totalAptos),
      totalComparecimento: sum(votosNulosBrancos.comparecimento),
    })
    .from(votosNulosBrancos)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0];
}

export async function getVotosNulosBrancosPorRegiao(filters: { anoEleicao: number; cargo: string }) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      bairroId: votosNulosBrancos.bairroId,
      bairroNome: bairros.nome,
      latitude: bairros.latitude,
      longitude: bairros.longitude,
      totalNulos: sum(votosNulosBrancos.votosNulos),
      totalBrancos: sum(votosNulosBrancos.votosBrancos),
      totalAbstencoes: sum(votosNulosBrancos.abstencoes),
    })
    .from(votosNulosBrancos)
    .leftJoin(bairros, eq(votosNulosBrancos.bairroId, bairros.id))
    .where(and(eq(votosNulosBrancos.anoEleicao, filters.anoEleicao), eq(votosNulosBrancos.cargo, filters.cargo)))
    .groupBy(votosNulosBrancos.bairroId, bairros.nome, bairros.latitude, bairros.longitude);
}

export async function getEvolucaoVotosNulosBrancos(cargo: string, municipioId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(votosNulosBrancos.cargo, cargo)];
  if (municipioId) conditions.push(eq(votosNulosBrancos.municipioId, municipioId));

  return db
    .select({
      anoEleicao: votosNulosBrancos.anoEleicao,
      totalNulos: sum(votosNulosBrancos.votosNulos),
      totalBrancos: sum(votosNulosBrancos.votosBrancos),
      totalAbstencoes: sum(votosNulosBrancos.abstencoes),
      totalAptos: sum(votosNulosBrancos.totalAptos),
    })
    .from(votosNulosBrancos)
    .where(and(...conditions))
    .groupBy(votosNulosBrancos.anoEleicao)
    .orderBy(votosNulosBrancos.anoEleicao);
}

// ==================== IMPORTAÇÕES ====================

export async function createImportacao(data: {
  userId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  tipoDataset: "eleitorado" | "candidatos" | "partidos" | "coligacoes" | "resultados" | "votos_nulos_brancos";
  anoReferencia?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(importacoes).values({
    userId: data.userId,
    nomeArquivo: data.nomeArquivo,
    tipoArquivo: data.tipoArquivo,
    tipoDataset: data.tipoDataset,
    anoReferencia: data.anoReferencia,
    status: "pendente",
  });

  return result[0].insertId;
}

export async function updateImportacao(id: number, data: Partial<typeof importacoes.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(importacoes).set(data).where(eq(importacoes.id, id));
}

export async function getImportacoes(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (userId) {
    return db.select().from(importacoes).where(eq(importacoes.userId, userId)).orderBy(desc(importacoes.createdAt));
  }
  return db.select().from(importacoes).orderBy(desc(importacoes.createdAt));
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalEleitores] = await db.select({ total: sum(eleitorado.totalEleitores) }).from(eleitorado);
  const [totalZonas] = await db.select({ total: count() }).from(zonasEleitorais);
  const [totalBairros] = await db.select({ total: count() }).from(bairros);
  const [totalMunicipios] = await db.select({ total: count() }).from(municipios);
  const [ultimaImportacao] = await db
    .select({ data: importacoes.createdAt })
    .from(importacoes)
    .where(eq(importacoes.status, "concluido"))
    .orderBy(desc(importacoes.createdAt))
    .limit(1);

  return {
    totalEleitores: Number(totalEleitores?.total) || 0,
    totalZonas: Number(totalZonas?.total) || 0,
    totalBairros: Number(totalBairros?.total) || 0,
    totalMunicipios: Number(totalMunicipios?.total) || 0,
    ultimaAtualizacao: ultimaImportacao?.data || null,
  };
}

// ==================== AUDIT LOGS ====================

export async function createAuditLog(data: {
  userId?: number;
  action: string;
  tableName?: string;
  recordId?: number;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

// ==================== DEMO DATA ====================

export async function getDemoData(dataType?: string) {
  const db = await getDb();
  if (!db) return [];

  if (dataType) {
    return db.select().from(demoData).where(eq(demoData.dataType, dataType));
  }
  return db.select().from(demoData);
}

export async function insertDemoData(data: { dataType: string; dataContent: unknown; description?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(demoData).values(data);
}

// ==================== BULK INSERTS ====================

export async function bulkInsertEleitorado(data: (typeof eleitorado.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(eleitorado).values(data);
}

export async function bulkInsertResultados(data: (typeof resultadosEleitorais.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(resultadosEleitorais).values(data);
}

export async function bulkInsertVotosNulosBrancos(data: (typeof votosNulosBrancos.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(votosNulosBrancos).values(data);
}

export async function bulkInsertBairros(data: (typeof bairros.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bairros).values(data);
}

export async function bulkInsertZonas(data: (typeof zonasEleitorais.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(zonasEleitorais).values(data);
}

export async function bulkInsertPartidos(data: (typeof partidos.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(partidos).values(data);
}

export async function bulkInsertCandidatos(data: (typeof candidatos.$inferInsert)[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(candidatos).values(data);
}

export async function insertMunicipio(data: typeof municipios.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(municipios).values(data);
  return result[0].insertId;
}

export async function insertRegiao(data: typeof regioes.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(regioes).values(data);
  return result[0].insertId;
}
