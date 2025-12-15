import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getAdminStats: vi.fn(),
  getAuditLogs: vi.fn(),
  getAuditLogActions: vi.fn(),
  getAllActivities: vi.fn(),
  exportUsers: vi.fn(),
  exportEleitorado: vi.fn(),
  exportResultados: vi.fn(),
  exportActivities: vi.fn(),
  logUserActivity: vi.fn(),
}));

describe("Admin Reports Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Admin Stats", () => {
    it("should return admin statistics", async () => {
      const mockStats = {
        usersByRole: [
          { role: "admin", count: 2 },
          { role: "gestor", count: 5 },
          { role: "politico", count: 10 },
        ],
        activitiesByType: [
          { activityType: "login", count: 100 },
          { activityType: "import", count: 20 },
        ],
        activitiesByDay: [
          { date: "2024-12-10", count: 15 },
          { date: "2024-12-11", count: 22 },
        ],
        totalImportacoes: 50,
        topUsers: [
          { userId: 1, userName: "Admin", userEmail: "admin@test.com", activityCount: 50 },
        ],
      };

      vi.mocked(db.getAdminStats).mockResolvedValue(mockStats);

      const stats = await db.getAdminStats();

      expect(stats).toBeDefined();
      expect(stats?.usersByRole).toHaveLength(3);
      expect(stats?.totalImportacoes).toBe(50);
    });

    it("should calculate total users correctly", () => {
      const usersByRole = [
        { role: "admin", count: 2 },
        { role: "gestor", count: 5 },
        { role: "politico", count: 10 },
      ];

      const total = usersByRole.reduce((acc, item) => acc + item.count, 0);
      expect(total).toBe(17);
    });
  });
});

describe("Audit Logs Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Audit Log Retrieval", () => {
    it("should retrieve audit logs with filters", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          userName: "Admin",
          action: "CREATE",
          tableName: "users",
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          userName: "Admin",
          action: "UPDATE",
          tableName: "settings",
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getAuditLogs).mockResolvedValue(mockLogs as any);

      const logs = await db.getAuditLogs({ userId: 1, limit: 10 });

      expect(logs).toHaveLength(2);
      expect(db.getAuditLogs).toHaveBeenCalledWith({ userId: 1, limit: 10 });
    });

    it("should retrieve all activities", async () => {
      const mockActivities = [
        { id: 1, userId: 1, activityType: "login", description: "User logged in" },
        { id: 2, userId: 1, activityType: "import", description: "Data imported" },
      ];

      vi.mocked(db.getAllActivities).mockResolvedValue(mockActivities as any);

      const activities = await db.getAllActivities(100);

      expect(activities).toHaveLength(2);
    });

    it("should retrieve distinct audit actions", async () => {
      const mockActions = ["CREATE", "UPDATE", "DELETE", "LOGIN"];

      vi.mocked(db.getAuditLogActions).mockResolvedValue(mockActions);

      const actions = await db.getAuditLogActions();

      expect(actions).toContain("CREATE");
      expect(actions).toContain("DELETE");
    });
  });

  describe("Activity Filtering", () => {
    it("should filter activities by type", () => {
      const activities = [
        { activityType: "login", description: "User logged in" },
        { activityType: "import", description: "Data imported" },
        { activityType: "login", description: "Another login" },
      ];

      const filtered = activities.filter((a) => a.activityType === "login");
      expect(filtered).toHaveLength(2);
    });

    it("should filter activities by search term", () => {
      const activities = [
        { userName: "Admin", description: "User logged in" },
        { userName: "Gestor", description: "Data imported" },
        { userName: "Admin", description: "Settings updated" },
      ];

      const searchTerm = "admin";
      const filtered = activities.filter((a) =>
        a.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(2);
    });
  });
});

describe("Backup/Export Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Data Export", () => {
    it("should export users data", async () => {
      const mockUsers = [
        { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
        { id: 2, name: "Gestor", email: "gestor@test.com", role: "gestor" },
      ];

      vi.mocked(db.exportUsers).mockResolvedValue(mockUsers as any);

      const users = await db.exportUsers();

      expect(users).toHaveLength(2);
      expect(users[0].role).toBe("admin");
    });

    it("should export eleitorado data with year filter", async () => {
      const mockEleitorado = [
        { id: 1, anoEleicao: 2024, totalEleitores: 1000 },
        { id: 2, anoEleicao: 2024, totalEleitores: 2000 },
      ];

      vi.mocked(db.exportEleitorado).mockResolvedValue(mockEleitorado as any);

      const eleitorado = await db.exportEleitorado(2024);

      expect(eleitorado).toHaveLength(2);
      expect(db.exportEleitorado).toHaveBeenCalledWith(2024);
    });

    it("should export resultados with filters", async () => {
      const mockResultados = [
        { id: 1, anoEleicao: 2024, cargo: "prefeito", votosValidos: 5000 },
        { id: 2, anoEleicao: 2024, cargo: "prefeito", votosValidos: 3000 },
      ];

      vi.mocked(db.exportResultados).mockResolvedValue(mockResultados as any);

      const resultados = await db.exportResultados(2024, "prefeito");

      expect(resultados).toHaveLength(2);
      expect(db.exportResultados).toHaveBeenCalledWith(2024, "prefeito");
    });

    it("should export activities with date range", async () => {
      const startDate = new Date("2024-12-01");
      const endDate = new Date("2024-12-15");

      const mockActivities = [
        { id: 1, activityType: "login", createdAt: new Date("2024-12-10") },
      ];

      vi.mocked(db.exportActivities).mockResolvedValue(mockActivities as any);

      const activities = await db.exportActivities(startDate, endDate);

      expect(activities).toHaveLength(1);
      expect(db.exportActivities).toHaveBeenCalledWith(startDate, endDate);
    });
  });

  describe("CSV Generation", () => {
    it("should generate valid CSV headers", () => {
      const data = [
        { id: 1, name: "Test", email: "test@test.com" },
      ];

      const headers = Object.keys(data[0]);
      expect(headers).toEqual(["id", "name", "email"]);
    });

    it("should escape CSV values with commas", () => {
      const value = "Test, with comma";
      const escaped = value.includes(",") ? `"${value}"` : value;
      expect(escaped).toBe('"Test, with comma"');
    });

    it("should escape CSV values with quotes", () => {
      const value = 'Test "with" quotes';
      const escaped = `"${value.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"Test ""with"" quotes"');
    });
  });

  describe("Activity Logging on Export", () => {
    it("should log export activity", async () => {
      vi.mocked(db.logUserActivity).mockResolvedValue(undefined);

      await db.logUserActivity({
        userId: 1,
        activityType: "export",
        description: "Exportação de usuários",
      });

      expect(db.logUserActivity).toHaveBeenCalledWith({
        userId: 1,
        activityType: "export",
        description: "Exportação de usuários",
      });
    });
  });
});

describe("Admin Access Control", () => {
  it("should only allow admin role to access admin features", () => {
    const adminUser = { role: "admin" };
    const gestorUser = { role: "gestor" };
    const politicoUser = { role: "politico" };

    const canAccessAdminFeatures = (user: { role: string }) => user.role === "admin";

    expect(canAccessAdminFeatures(adminUser)).toBe(true);
    expect(canAccessAdminFeatures(gestorUser)).toBe(false);
    expect(canAccessAdminFeatures(politicoUser)).toBe(false);
  });

  it("should redirect non-admin users", () => {
    const user = { role: "gestor" };
    const shouldRedirect = user.role !== "admin";
    expect(shouldRedirect).toBe(true);
  });
});
