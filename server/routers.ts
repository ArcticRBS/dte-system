import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as auth from "./auth";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

// ==================== ROLE-BASED PROCEDURES ====================

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const gestorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "gestor"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores e administradores" });
  }
  return next({ ctx });
});

const politicoProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "gestor", "politico"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
  }
  return next({ ctx });
});

// ==================== ROUTERS ====================

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  
  // Login tradicional com usuário/senha
  login: publicProcedure
    .input(
      z.object({
        usernameOrEmail: z.string().min(1, "Usuário ou email é obrigatório"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await auth.authenticateUser(input.usernameOrEmail, input.password);
      
      if (!result.success || !result.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: result.error || "Falha na autenticação" });
      }

      // Create JWT token
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      const token = await new SignJWT({
        sub: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      };
    }),

  // Registro de novo usuário
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        name: z.string().min(2, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await auth.createUser({
        username: input.username,
        password: input.password,
        name: input.name,
        email: input.email,
        role: "demo", // Novos usuários começam como demo
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error || "Erro ao criar usuário" });
      }

      return { success: true, message: "Usuário criado com sucesso" };
    }),

  // Alterar senha
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await auth.updatePassword(
        ctx.user.id,
        input.currentPassword,
        input.newPassword
      );

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error || "Erro ao alterar senha" });
      }

      return { success: true };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

const usersRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Email inválido").optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.updateUserProfile(ctx.user.id, input.name, input.email);
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "update",
        description: "Perfil atualizado",
      });
      return { success: true };
    }),
  updateAvatar: protectedProcedure
    .input(z.object({ avatarUrl: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      await db.updateUserAvatar(ctx.user.id, input.avatarUrl);
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "update",
        description: "Foto de perfil atualizada",
      });
      return { success: true };
    }),
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "gestor", "politico", "demo"]),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),
  myActivities: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return db.getUserActivities(ctx.user.id, input?.limit || 50);
    }),
  allActivities: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getAllActivities(input?.limit || 100);
    }),
});

const geografiaRouter = router({
  regioes: publicProcedure.query(async () => {
    return db.getRegioes();
  }),
  municipios: publicProcedure
    .input(z.object({ regiaoId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getMunicipios(input?.regiaoId);
    }),
  bairros: publicProcedure
    .input(z.object({ municipioId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getBairros(input?.municipioId);
    }),
  zonasEleitorais: publicProcedure
    .input(z.object({ municipioId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getZonasEleitorais(input?.municipioId);
    }),
});

const eleitoradoRouter = router({
  stats: publicProcedure
    .input(
      z
        .object({
          anoEleicao: z.number().optional(),
          municipioId: z.number().optional(),
          bairroId: z.number().optional(),
          zonaId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.getEleitoradoStats(input);
    }),
  porBairro: publicProcedure
    .input(
      z.object({
        anoEleicao: z.number(),
        municipioId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getEleitoradoPorBairro(input.anoEleicao, input.municipioId);
    }),
});

const partidosRouter = router({
  list: publicProcedure.query(async () => {
    return db.getPartidos();
  }),
});

const candidatosRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          anoEleicao: z.number().optional(),
          cargo: z.string().optional(),
          partidoId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.getCandidatos(input);
    }),
});

const resultadosRouter = router({
  porPartido: publicProcedure
    .input(
      z.object({
        anoEleicao: z.number(),
        cargo: z.string(),
        municipioId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getResultadosPorPartido(input);
    }),
  porCandidato: publicProcedure
    .input(
      z.object({
        anoEleicao: z.number(),
        cargo: z.string(),
        municipioId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getResultadosPorCandidato(input);
    }),
  comparacao: publicProcedure
    .input(
      z.object({
        cargo: z.string(),
        municipioId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getComparacaoEleicoes(input.cargo, input.municipioId);
    }),
});

const votosNulosBrancosRouter = router({
  stats: publicProcedure
    .input(
      z
        .object({
          anoEleicao: z.number().optional(),
          cargo: z.string().optional(),
          municipioId: z.number().optional(),
          bairroId: z.number().optional(),
          zonaId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.getVotosNulosBrancosStats(input);
    }),
  porRegiao: publicProcedure
    .input(
      z.object({
        anoEleicao: z.number(),
        cargo: z.string(),
      })
    )
    .query(async ({ input }) => {
      return db.getVotosNulosBrancosPorRegiao(input);
    }),
  evolucao: publicProcedure
    .input(
      z.object({
        cargo: z.string(),
        municipioId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getEvolucaoVotosNulosBrancos(input.cargo, input.municipioId);
    }),
});

const dashboardRouter = router({
  stats: publicProcedure.query(async () => {
    return db.getDashboardStats();
  }),
});

const importacoesRouter = router({
  list: gestorProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      return db.getImportacoes();
    }
    return db.getImportacoes(ctx.user.id);
  }),
  create: gestorProcedure
    .input(
      z.object({
        nomeArquivo: z.string(),
        tipoArquivo: z.string(),
        tipoDataset: z.enum(["eleitorado", "candidatos", "partidos", "coligacoes", "resultados", "votos_nulos_brancos"]),
        anoReferencia: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.createImportacao({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),
  update: gestorProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "processando", "concluido", "erro"]).optional(),
        totalRegistros: z.number().optional(),
        registrosImportados: z.number().optional(),
        registrosErro: z.number().optional(),
        mensagemErro: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateImportacao(id, data);
      return { success: true };
    }),
  processData: gestorProcedure
    .input(
      z.object({
        importacaoId: z.number(),
        tipoDataset: z.enum(["eleitorado", "candidatos", "partidos", "coligacoes", "resultados", "votos_nulos_brancos"]),
        data: z.array(z.record(z.string(), z.unknown())),
        anoReferencia: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { importacaoId, tipoDataset, data, anoReferencia } = input;

      try {
        await db.updateImportacao(importacaoId, { status: "processando", totalRegistros: data.length });

        let registrosImportados = 0;
        let registrosErro = 0;

        if (tipoDataset === "eleitorado") {
          const records = data.map((row: any) => ({
            anoEleicao: anoReferencia || new Date().getFullYear(),
            totalEleitores: parseInt(row.totalEleitores || row.total_eleitores || "0"),
            eleitoresMasculino: parseInt(row.masculino || row.eleitores_masculino || "0"),
            eleitoresFeminino: parseInt(row.feminino || row.eleitores_feminino || "0"),
            faixa16a17: parseInt(row.faixa_16_17 || row.faixa16a17 || "0"),
            faixa18a24: parseInt(row.faixa_18_24 || row.faixa18a24 || "0"),
            faixa25a34: parseInt(row.faixa_25_34 || row.faixa25a34 || "0"),
            faixa35a44: parseInt(row.faixa_35_44 || row.faixa35a44 || "0"),
            faixa45a59: parseInt(row.faixa_45_59 || row.faixa45a59 || "0"),
            faixa60a69: parseInt(row.faixa_60_69 || row.faixa60a69 || "0"),
            faixa70mais: parseInt(row.faixa_70_mais || row.faixa70mais || "0"),
            escolaridadeAnalfabeto: parseInt(row.analfabeto || row.escolaridade_analfabeto || "0"),
            escolaridadeFundamental: parseInt(row.fundamental || row.escolaridade_fundamental || "0"),
            escolaridadeMedio: parseInt(row.medio || row.escolaridade_medio || "0"),
            escolaridadeSuperior: parseInt(row.superior || row.escolaridade_superior || "0"),
          }));
          await db.bulkInsertEleitorado(records);
          registrosImportados = records.length;
        } else if (tipoDataset === "votos_nulos_brancos") {
          const records = data.map((row: any) => ({
            anoEleicao: anoReferencia || new Date().getFullYear(),
            cargo: row.cargo || "Prefeito",
            turno: parseInt(row.turno || "1"),
            votosNulos: parseInt(row.votos_nulos || row.nulos || "0"),
            votosBrancos: parseInt(row.votos_brancos || row.brancos || "0"),
            abstencoes: parseInt(row.abstencoes || "0"),
            totalAptos: parseInt(row.total_aptos || row.aptos || "0"),
            comparecimento: parseInt(row.comparecimento || "0"),
          }));
          await db.bulkInsertVotosNulosBrancos(records);
          registrosImportados = records.length;
        } else if (tipoDataset === "resultados") {
          const records = data.map((row: any) => ({
            anoEleicao: anoReferencia || new Date().getFullYear(),
            cargo: row.cargo || "Prefeito",
            turno: parseInt(row.turno || "1"),
            votosValidos: parseInt(row.votos_validos || row.votos || "0"),
            votosNominais: parseInt(row.votos_nominais || "0"),
            votosLegenda: parseInt(row.votos_legenda || "0"),
          }));
          await db.bulkInsertResultados(records);
          registrosImportados = records.length;
        }

        await db.updateImportacao(importacaoId, {
          status: "concluido",
          registrosImportados,
          registrosErro,
        });

        return { success: true, registrosImportados, registrosErro };
      } catch (error: any) {
        await db.updateImportacao(importacaoId, {
          status: "erro",
          mensagemErro: error.message,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),
});

const demoRouter = router({
  getData: publicProcedure
    .input(z.object({ dataType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.getDemoData(input?.dataType);
    }),
  seedDemoData: adminProcedure.mutation(async () => {
    // Seed demo data for demonstration
    const demoEleitorado = {
      dataType: "eleitorado_demo",
      dataContent: {
        totalEleitores: 245678,
        masculino: 118234,
        feminino: 127444,
        faixasEtarias: {
          "16-17": 4521,
          "18-24": 32456,
          "25-34": 48923,
          "35-44": 52341,
          "45-59": 58234,
          "60-69": 32145,
          "70+": 17058,
        },
        escolaridade: {
          analfabeto: 8234,
          fundamental: 45678,
          medio: 98234,
          superior: 93532,
        },
      },
      description: "Dados de demonstração do eleitorado",
    };

    const demoVotosNulosBrancos = {
      dataType: "votos_nulos_brancos_demo",
      dataContent: {
        anos: [2020, 2022, 2024],
        dados: [
          { ano: 2020, nulos: 12345, brancos: 8765, abstencoes: 34567, aptos: 230000 },
          { ano: 2022, nulos: 11234, brancos: 7654, abstencoes: 32456, aptos: 238000 },
          { ano: 2024, nulos: 10123, brancos: 6543, abstencoes: 30345, aptos: 245678 },
        ],
      },
      description: "Dados de demonstração de votos nulos e brancos",
    };

    const demoResultados = {
      dataType: "resultados_demo",
      dataContent: {
        partidos: [
          { sigla: "PT", votos: 45678, cor: "#FF0000" },
          { sigla: "PL", votos: 42345, cor: "#0000FF" },
          { sigla: "MDB", votos: 38234, cor: "#00FF00" },
          { sigla: "PSDB", votos: 28456, cor: "#FFFF00" },
          { sigla: "PP", votos: 22345, cor: "#FF00FF" },
          { sigla: "OUTROS", votos: 45678, cor: "#808080" },
        ],
      },
      description: "Dados de demonstração de resultados eleitorais",
    };

    const demoBairros = {
      dataType: "bairros_demo",
      dataContent: [
        { nome: "Centro", eleitores: 25678, latitude: "-8.7619", longitude: "-63.9039", nulos: 1234, brancos: 876 },
        { nome: "Nova Porto Velho", eleitores: 18234, latitude: "-8.7520", longitude: "-63.8940", nulos: 987, brancos: 654 },
        { nome: "Embratel", eleitores: 15678, latitude: "-8.7421", longitude: "-63.8841", nulos: 876, brancos: 543 },
        { nome: "Caiari", eleitores: 12345, latitude: "-8.7322", longitude: "-63.8742", nulos: 765, brancos: 432 },
        { nome: "São Cristóvão", eleitores: 11234, latitude: "-8.7223", longitude: "-63.8643", nulos: 654, brancos: 321 },
        { nome: "Arigolândia", eleitores: 9876, latitude: "-8.7124", longitude: "-63.8544", nulos: 543, brancos: 210 },
        { nome: "Pedrinhas", eleitores: 8765, latitude: "-8.7025", longitude: "-63.8445", nulos: 432, brancos: 198 },
        { nome: "Tancredo Neves", eleitores: 7654, latitude: "-8.6926", longitude: "-63.8346", nulos: 321, brancos: 187 },
      ],
      description: "Dados de demonstração por bairro",
    };

    await db.insertDemoData({ dataType: demoEleitorado.dataType, dataContent: demoEleitorado.dataContent, description: demoEleitorado.description });
    await db.insertDemoData({ dataType: demoVotosNulosBrancos.dataType, dataContent: demoVotosNulosBrancos.dataContent, description: demoVotosNulosBrancos.description });
    await db.insertDemoData({ dataType: demoResultados.dataType, dataContent: demoResultados.dataContent, description: demoResultados.description });
    await db.insertDemoData({ dataType: demoBairros.dataType, dataContent: demoBairros.dataContent, description: demoBairros.description });

    return { success: true };
  }),
});

// ==================== MAIN ROUTER ====================

// ==================== ADMIN REPORTS ROUTER ====================

const adminReportsRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getAdminStats();
  }),
});

// ==================== AUDIT LOGS ROUTER ====================

const auditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return db.getAuditLogs(input);
    }),
  actions: adminProcedure.query(async () => {
    return db.getAuditLogActions();
  }),
  activities: adminProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return db.getAllActivities(input?.limit || 100);
    }),
});

// ==================== BACKUP/EXPORT ROUTER ====================

const backupRouter = router({
  users: adminProcedure.query(async ({ ctx }) => {
    await db.logUserActivity({
      userId: ctx.user.id,
      activityType: "export",
      description: "Exportação de usuários",
    });
    return db.exportUsers();
  }),
  eleitorado: adminProcedure
    .input(z.object({ anoEleicao: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "export",
        description: `Exportação de eleitorado${input?.anoEleicao ? ` (${input.anoEleicao})` : ""}`,
      });
      return db.exportEleitorado(input?.anoEleicao);
    }),
  resultados: adminProcedure
    .input(
      z.object({
        anoEleicao: z.number().optional(),
        cargo: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "export",
        description: `Exportação de resultados eleitorais${input?.anoEleicao ? ` (${input.anoEleicao})` : ""}`,
      });
      return db.exportResultados(input?.anoEleicao, input?.cargo);
    }),
  activities: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "export",
        description: "Exportação de atividades",
      });
      return db.exportActivities(input?.startDate, input?.endDate);
    }),
});

// ==================== SETTINGS ROUTER ====================

const settingsRouter = router({
  list: adminProcedure.query(async () => {
    return db.getSystemSettings();
  }),
  get: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      return db.getSystemSetting(input.key);
    }),
  upsert: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.upsertSystemSetting(input.key, input.value, input.description);
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "update",
        description: `Configuração '${input.key}' atualizada`,
      });
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteSystemSetting(input.key);
      await db.logUserActivity({
        userId: ctx.user.id,
        activityType: "delete",
        description: `Configuração '${input.key}' removida`,
      });
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  geografia: geografiaRouter,
  eleitorado: eleitoradoRouter,
  partidos: partidosRouter,
  candidatos: candidatosRouter,
  resultados: resultadosRouter,
  votosNulosBrancos: votosNulosBrancosRouter,
  dashboard: dashboardRouter,
  importacoes: importacoesRouter,
  demo: demoRouter,
  settings: settingsRouter,
  adminReports: adminReportsRouter,
  audit: auditRouter,
  backup: backupRouter,
});

export type AppRouter = typeof appRouter;
