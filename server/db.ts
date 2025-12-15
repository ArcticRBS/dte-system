import { eq, and, desc, sql, gte, lte, sum, count, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  userActivities,
  ActivityType,
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


// ==================== ATIVIDADES DO USUÁRIO ====================

export async function logUserActivity(data: {
  userId: number;
  activityType: ActivityType;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userActivities).values({
    userId: data.userId,
    activityType: data.activityType,
    description: data.description,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

export async function getUserActivities(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(userActivities)
    .where(eq(userActivities.userId, userId))
    .orderBy(desc(userActivities.createdAt))
    .limit(limit);
}

export async function getAllActivities(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: userActivities.id,
    userId: userActivities.userId,
    userName: users.name,
    userEmail: users.email,
    activityType: userActivities.activityType,
    description: userActivities.description,
    metadata: userActivities.metadata,
    ipAddress: userActivities.ipAddress,
    createdAt: userActivities.createdAt,
  })
    .from(userActivities)
    .leftJoin(users, eq(userActivities.userId, users.id))
    .orderBy(desc(userActivities.createdAt))
    .limit(limit);
}

// ==================== AVATAR DO USUÁRIO ====================

export async function updateUserAvatar(userId: number, avatarUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
}

// ==================== CONFIGURAÇÕES DO SISTEMA ====================

export async function getSystemSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemSettings);
}

export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select()
    .from(systemSettings)
    .where(eq(systemSettings.settingKey, key))
    .limit(1);
  return result[0] || null;
}

export async function upsertSystemSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemSettings)
    .values({ settingKey: key, settingValue: value, description })
    .onDuplicateKeyUpdate({ set: { settingValue: value, description } });
}

export async function deleteSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(systemSettings).where(eq(systemSettings.settingKey, key));
}


// ==================== RELATÓRIOS ADMIN ====================

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  // Total de usuários por role
  const usersByRole = await db.select({
    role: users.role,
    count: count(),
  })
    .from(users)
    .groupBy(users.role);

  // Total de atividades por tipo nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activitiesByType = await db.select({
    activityType: userActivities.activityType,
    count: count(),
  })
    .from(userActivities)
    .where(gte(userActivities.createdAt, thirtyDaysAgo))
    .groupBy(userActivities.activityType);

  // Atividades por dia nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const activitiesByDay = await db.select({
    date: sql<string>`DATE(${userActivities.createdAt})`,
    count: count(),
  })
    .from(userActivities)
    .where(gte(userActivities.createdAt, sevenDaysAgo))
    .groupBy(sql`DATE(${userActivities.createdAt})`)
    .orderBy(sql`DATE(${userActivities.createdAt})`);

  // Total de importações
  const totalImportacoes = await db.select({ count: count() }).from(importacoes);

  // Usuários mais ativos
  const topUsers = await db.select({
    userId: userActivities.userId,
    userName: users.name,
    userEmail: users.email,
    activityCount: count(),
  })
    .from(userActivities)
    .leftJoin(users, eq(userActivities.userId, users.id))
    .groupBy(userActivities.userId, users.name, users.email)
    .orderBy(desc(count()))
    .limit(10);

  return {
    usersByRole,
    activitiesByType,
    activitiesByDay,
    totalImportacoes: totalImportacoes[0]?.count || 0,
    topUsers,
  };
}

// ==================== LOGS DE AUDITORIA ====================

export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters?.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters?.startDate) conditions.push(gte(auditLogs.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(auditLogs.createdAt, filters.endDate));

  return db.select({
    id: auditLogs.id,
    userId: auditLogs.userId,
    userName: users.name,
    userEmail: users.email,
    action: auditLogs.action,
    tableName: auditLogs.tableName,
    recordId: auditLogs.recordId,
    oldValues: auditLogs.oldValues,
    newValues: auditLogs.newValues,
    ipAddress: auditLogs.ipAddress,
    userAgent: auditLogs.userAgent,
    createdAt: auditLogs.createdAt,
  })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit || 100);
}

export async function getAuditLogActions() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.selectDistinct({ action: auditLogs.action }).from(auditLogs);
  return result.map(r => r.action).filter(Boolean);
}

// ==================== EXPORTAÇÃO DE DADOS ====================

export async function exportUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    username: users.username,
    role: users.role,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(users.id);
}

export async function exportEleitorado(anoEleicao?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (anoEleicao) conditions.push(eq(eleitorado.anoEleicao, anoEleicao));
  
  return db.select({
    id: eleitorado.id,
    anoEleicao: eleitorado.anoEleicao,
    municipioId: eleitorado.municipioId,
    municipioNome: municipios.nome,
    zonaId: eleitorado.zonaId,
    zonaNome: zonasEleitorais.nome,
    bairroId: eleitorado.bairroId,
    bairroNome: bairros.nome,
    totalEleitores: eleitorado.totalEleitores,
    eleitoresMasculino: eleitorado.eleitoresMasculino,
    eleitoresFeminino: eleitorado.eleitoresFeminino,
    faixa16a17: eleitorado.faixa16a17,
    faixa18a24: eleitorado.faixa18a24,
    faixa25a34: eleitorado.faixa25a34,
    faixa35a44: eleitorado.faixa35a44,
    faixa45a59: eleitorado.faixa45a59,
    faixa60a69: eleitorado.faixa60a69,
    faixa70mais: eleitorado.faixa70mais,
    escolaridadeAnalfabeto: eleitorado.escolaridadeAnalfabeto,
    escolaridadeFundamental: eleitorado.escolaridadeFundamental,
    escolaridadeMedio: eleitorado.escolaridadeMedio,
    escolaridadeSuperior: eleitorado.escolaridadeSuperior,
  })
    .from(eleitorado)
    .leftJoin(municipios, eq(eleitorado.municipioId, municipios.id))
    .leftJoin(zonasEleitorais, eq(eleitorado.zonaId, zonasEleitorais.id))
    .leftJoin(bairros, eq(eleitorado.bairroId, bairros.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(eleitorado.id);
}

export async function exportResultados(anoEleicao?: number, cargo?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (anoEleicao) conditions.push(eq(resultadosEleitorais.anoEleicao, anoEleicao));
  if (cargo) conditions.push(eq(resultadosEleitorais.cargo, cargo));
  
  return db.select({
    id: resultadosEleitorais.id,
    anoEleicao: resultadosEleitorais.anoEleicao,
    turno: resultadosEleitorais.turno,
    cargo: resultadosEleitorais.cargo,
    municipioId: resultadosEleitorais.municipioId,
    municipioNome: municipios.nome,
    zonaId: resultadosEleitorais.zonaId,
    zonaNome: zonasEleitorais.nome,
    candidatoId: resultadosEleitorais.candidatoId,
    candidatoNome: candidatos.nome,
    candidatoNumero: candidatos.numero,
    partidoId: resultadosEleitorais.partidoId,
    partidoSigla: partidos.sigla,
    votosValidos: resultadosEleitorais.votosValidos,
    votosNominais: resultadosEleitorais.votosNominais,
    votosLegenda: resultadosEleitorais.votosLegenda,
  })
    .from(resultadosEleitorais)
    .leftJoin(municipios, eq(resultadosEleitorais.municipioId, municipios.id))
    .leftJoin(zonasEleitorais, eq(resultadosEleitorais.zonaId, zonasEleitorais.id))
    .leftJoin(candidatos, eq(resultadosEleitorais.candidatoId, candidatos.id))
    .leftJoin(partidos, eq(resultadosEleitorais.partidoId, partidos.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(resultadosEleitorais.id);
}

export async function exportActivities(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (startDate) conditions.push(gte(userActivities.createdAt, startDate));
  if (endDate) conditions.push(lte(userActivities.createdAt, endDate));
  
  return db.select({
    id: userActivities.id,
    userId: userActivities.userId,
    userName: users.name,
    userEmail: users.email,
    activityType: userActivities.activityType,
    description: userActivities.description,
    ipAddress: userActivities.ipAddress,
    createdAt: userActivities.createdAt,
  })
    .from(userActivities)
    .leftJoin(users, eq(userActivities.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(userActivities.createdAt));
}


// ==================== BACKUPS AGENDADOS ====================

import { scheduledBackups, backupHistory } from "../drizzle/schema";

export async function getScheduledBackups() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: scheduledBackups.id,
    name: scheduledBackups.name,
    dataTypes: scheduledBackups.dataTypes,
    frequency: scheduledBackups.frequency,
    dayOfWeek: scheduledBackups.dayOfWeek,
    dayOfMonth: scheduledBackups.dayOfMonth,
    timeOfDay: scheduledBackups.timeOfDay,
    emailRecipients: scheduledBackups.emailRecipients,
    format: scheduledBackups.format,
    isActive: scheduledBackups.isActive,
    lastRunAt: scheduledBackups.lastRunAt,
    nextRunAt: scheduledBackups.nextRunAt,
    createdBy: scheduledBackups.createdBy,
    createdByName: users.name,
    createdAt: scheduledBackups.createdAt,
  })
    .from(scheduledBackups)
    .leftJoin(users, eq(scheduledBackups.createdBy, users.id))
    .orderBy(desc(scheduledBackups.createdAt));
}

export async function getScheduledBackupById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select()
    .from(scheduledBackups)
    .where(eq(scheduledBackups.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createScheduledBackup(data: {
  name: string;
  dataTypes: string[];
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay?: string;
  emailRecipients?: string[];
  format?: "csv" | "json";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Calculate next run time
  const nextRunAt = calculateNextRunTime(data.frequency, data.dayOfWeek, data.dayOfMonth, data.timeOfDay);
  
  const result = await db.insert(scheduledBackups).values({
    name: data.name,
    dataTypes: data.dataTypes,
    frequency: data.frequency,
    dayOfWeek: data.dayOfWeek,
    dayOfMonth: data.dayOfMonth,
    timeOfDay: data.timeOfDay || "03:00",
    emailRecipients: data.emailRecipients,
    format: data.format || "csv",
    isActive: true,
    nextRunAt,
    createdBy: data.createdBy,
  });
  return result[0].insertId;
}

export async function updateScheduledBackup(id: number, data: {
  name?: string;
  dataTypes?: string[];
  frequency?: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay?: string;
  emailRecipients?: string[];
  format?: "csv" | "json";
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.dataTypes !== undefined) updateData.dataTypes = data.dataTypes;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
  if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
  if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay;
  if (data.emailRecipients !== undefined) updateData.emailRecipients = data.emailRecipients;
  if (data.format !== undefined) updateData.format = data.format;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  // Recalculate next run time if frequency changed
  if (data.frequency || data.dayOfWeek !== undefined || data.dayOfMonth !== undefined || data.timeOfDay) {
    const backup = await getScheduledBackupById(id);
    if (backup) {
      updateData.nextRunAt = calculateNextRunTime(
        data.frequency || backup.frequency,
        data.dayOfWeek ?? backup.dayOfWeek ?? undefined,
        data.dayOfMonth ?? backup.dayOfMonth ?? undefined,
        data.timeOfDay || backup.timeOfDay || "03:00"
      );
    }
  }
  
  await db.update(scheduledBackups).set(updateData).where(eq(scheduledBackups.id, id));
}

export async function deleteScheduledBackup(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scheduledBackups).where(eq(scheduledBackups.id, id));
}

export async function toggleScheduledBackup(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledBackups).set({ isActive }).where(eq(scheduledBackups.id, id));
}

// ==================== HISTÓRICO DE BACKUPS ====================

export async function getBackupHistory(limit = 50, scheduledBackupId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (scheduledBackupId) conditions.push(eq(backupHistory.scheduledBackupId, scheduledBackupId));
  
  return db.select({
    id: backupHistory.id,
    scheduledBackupId: backupHistory.scheduledBackupId,
    backupName: scheduledBackups.name,
    status: backupHistory.status,
    dataTypes: backupHistory.dataTypes,
    recordCounts: backupHistory.recordCounts,
    fileSize: backupHistory.fileSize,
    fileUrl: backupHistory.fileUrl,
    errorMessage: backupHistory.errorMessage,
    emailSent: backupHistory.emailSent,
    startedAt: backupHistory.startedAt,
    completedAt: backupHistory.completedAt,
  })
    .from(backupHistory)
    .leftJoin(scheduledBackups, eq(backupHistory.scheduledBackupId, scheduledBackups.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(backupHistory.startedAt))
    .limit(limit);
}

export async function createBackupHistoryEntry(data: {
  scheduledBackupId?: number;
  dataTypes: string[];
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(backupHistory).values({
    scheduledBackupId: data.scheduledBackupId,
    dataTypes: data.dataTypes,
    status: "running",
  });
  return result[0].insertId;
}

export async function updateBackupHistoryEntry(id: number, data: {
  status?: "success" | "failed" | "running";
  recordCounts?: Record<string, number>;
  fileSize?: number;
  fileUrl?: string;
  errorMessage?: string;
  emailSent?: boolean;
  completedAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(backupHistory).set(data).where(eq(backupHistory.id, id));
}

// ==================== MÉTRICAS COMPARATIVAS ====================

export async function getComparativeStats(currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date) {
  const db = await getDb();
  if (!db) return null;

  // Atividades do período atual
  const currentActivities = await db.select({ count: count() })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, currentStart),
      lte(userActivities.createdAt, currentEnd)
    ));

  // Atividades do período anterior
  const previousActivities = await db.select({ count: count() })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, previousStart),
      lte(userActivities.createdAt, previousEnd)
    ));

  // Novos usuários no período atual
  const currentNewUsers = await db.select({ count: count() })
    .from(users)
    .where(and(
      gte(users.createdAt, currentStart),
      lte(users.createdAt, currentEnd)
    ));

  // Novos usuários no período anterior
  const previousNewUsers = await db.select({ count: count() })
    .from(users)
    .where(and(
      gte(users.createdAt, previousStart),
      lte(users.createdAt, previousEnd)
    ));

  // Importações no período atual
  const currentImports = await db.select({ count: count() })
    .from(importacoes)
    .where(and(
      gte(importacoes.createdAt, currentStart),
      lte(importacoes.createdAt, currentEnd)
    ));

  // Importações no período anterior
  const previousImports = await db.select({ count: count() })
    .from(importacoes)
    .where(and(
      gte(importacoes.createdAt, previousStart),
      lte(importacoes.createdAt, previousEnd)
    ));

  // Logins no período atual
  const currentLogins = await db.select({ count: count() })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, currentStart),
      lte(userActivities.createdAt, currentEnd),
      eq(userActivities.activityType, "login")
    ));

  // Logins no período anterior
  const previousLogins = await db.select({ count: count() })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, previousStart),
      lte(userActivities.createdAt, previousEnd),
      eq(userActivities.activityType, "login")
    ));

  // Atividades por dia no período atual
  const activitiesByDayCurrent = await db.select({
    date: sql<string>`DATE(${userActivities.createdAt})`,
    count: count(),
  })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, currentStart),
      lte(userActivities.createdAt, currentEnd)
    ))
    .groupBy(sql`DATE(${userActivities.createdAt})`)
    .orderBy(sql`DATE(${userActivities.createdAt})`);

  // Atividades por dia no período anterior
  const activitiesByDayPrevious = await db.select({
    date: sql<string>`DATE(${userActivities.createdAt})`,
    count: count(),
  })
    .from(userActivities)
    .where(and(
      gte(userActivities.createdAt, previousStart),
      lte(userActivities.createdAt, previousEnd)
    ))
    .groupBy(sql`DATE(${userActivities.createdAt})`)
    .orderBy(sql`DATE(${userActivities.createdAt})`);

  return {
    current: {
      activities: Number(currentActivities[0]?.count || 0),
      newUsers: Number(currentNewUsers[0]?.count || 0),
      imports: Number(currentImports[0]?.count || 0),
      logins: Number(currentLogins[0]?.count || 0),
      activitiesByDay: activitiesByDayCurrent,
    },
    previous: {
      activities: Number(previousActivities[0]?.count || 0),
      newUsers: Number(previousNewUsers[0]?.count || 0),
      imports: Number(previousImports[0]?.count || 0),
      logins: Number(previousLogins[0]?.count || 0),
      activitiesByDay: activitiesByDayPrevious,
    },
  };
}

// Helper function to calculate next run time
function calculateNextRunTime(
  frequency: "daily" | "weekly" | "monthly",
  dayOfWeek?: number,
  dayOfMonth?: number,
  timeOfDay?: string
): Date {
  const now = new Date();
  const [hours, minutes] = (timeOfDay || "03:00").split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (frequency === "daily") {
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === "weekly") {
    const targetDay = dayOfWeek ?? 0; // Default to Sunday
    const currentDay = next.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && next <= now)) {
      daysUntilTarget += 7;
    }
    next.setDate(next.getDate() + daysUntilTarget);
  } else if (frequency === "monthly") {
    const targetDayOfMonth = dayOfMonth ?? 1;
    next.setDate(targetDayOfMonth);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}


// ==================== NOTIFICAÇÕES ADMIN ====================

import { adminNotifications } from "../drizzle/schema";

export async function getAdminNotifications(userId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (userId) {
    // Get notifications for specific user or all admins (userId = null)
    conditions.push(
      or(
        eq(adminNotifications.userId, userId),
        isNull(adminNotifications.userId)
      )
    );
  }
  
  return db.select()
    .from(adminNotifications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(adminNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: count() })
    .from(adminNotifications)
    .where(and(
      or(
        eq(adminNotifications.userId, userId),
        isNull(adminNotifications.userId)
      ),
      eq(adminNotifications.isRead, false)
    ));
  
  return Number(result[0]?.count || 0);
}

export async function createAdminNotification(data: {
  userId?: number;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  category?: "backup" | "security" | "system" | "user" | "import";
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(adminNotifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || "info",
    category: data.category || "system",
    actionUrl: data.actionUrl,
    metadata: data.metadata,
  });
  
  return result[0].insertId;
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminNotifications)
    .set({ isRead: true })
    .where(
      or(
        eq(adminNotifications.userId, userId),
        isNull(adminNotifications.userId)
      )
    );
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
}

// Helper to send notification to all admins
export async function notifyAllAdmins(data: {
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  category?: "backup" | "security" | "system" | "user" | "import";
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  return createAdminNotification({
    ...data,
    userId: undefined, // null = all admins
  });
}
