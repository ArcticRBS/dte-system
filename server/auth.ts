import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { getDb } from "./db";
import { users, type User, type UserRole } from "../drizzle/schema";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user with username/password
 */
export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: UserRole;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Check if username or email already exists
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, data.username), eq(users.email, data.email)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].username === data.username) {
        return { success: false, error: "Nome de usuário já existe" };
      }
      if (existing[0].email === data.email) {
        return { success: false, error: "Email já cadastrado" };
      }
    }

    const passwordHash = await hashPassword(data.password);
    const openId = `local_${data.username}_${Date.now()}`;

    await db.insert(users).values({
      openId,
      username: data.username,
      passwordHash,
      name: data.name,
      email: data.email,
      loginMethod: "local",
      role: data.role || "demo",
      isActive: true,
    });

    const newUser = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    return { success: true, user: newUser[0] };
  } catch (error) {
    console.error("[Auth] Error creating user:", error);
    return { success: false, error: "Erro ao criar usuário" };
  }
}

/**
 * Authenticate user with username/password
 */
export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    // Find user by username or email
    const result = await db
      .select()
      .from(users)
      .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = result[0];

    if (!user.isActive) {
      return { success: false, error: "Conta desativada" };
    }

    if (!user.passwordHash) {
      return { success: false, error: "Este usuário usa login social. Use Google ou GitHub para entrar." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Senha incorreta" };
    }

    // Update last signed in
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    return { success: true, user };
  } catch (error) {
    console.error("[Auth] Error authenticating user:", error);
    return { success: false, error: "Erro ao autenticar" };
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (result.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = result[0];

    if (user.passwordHash) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Senha atual incorreta" };
      }
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("[Auth] Error updating password:", error);
    return { success: false, error: "Erro ao atualizar senha" };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

/**
 * Update user's password hash directly (for admin use)
 */
export async function setUserPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ 
      passwordHash: newHash,
      loginMethod: "local"
    }).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("[Auth] Error setting password:", error);
    return { success: false, error: "Erro ao definir senha" };
  }
}
