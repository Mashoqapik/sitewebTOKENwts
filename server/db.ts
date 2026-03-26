import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertVaultItem, users, vaultItems } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Vault Items ───────────────────────────────────────────────────────────────

export async function getVaultItems(parentId: number | null) {
  const db = await getDb();
  if (!db) return [];
  const condition = parentId === null
    ? isNull(vaultItems.parentId)
    : eq(vaultItems.parentId, parentId);
  return db.select().from(vaultItems).where(condition).orderBy(vaultItems.type, vaultItems.name);
}

export async function getRecentFiles(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vaultItems)
    .where(eq(vaultItems.type, "file"))
    .orderBy(desc(vaultItems.lastAccessedAt))
    .limit(limit);
}

export async function getAllItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vaultItems).orderBy(vaultItems.type, vaultItems.name);
}

export async function getVaultItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vaultItems).where(eq(vaultItems.id, id)).limit(1);
  return result[0];
}

export async function createVaultItem(item: InsertVaultItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(vaultItems).values(item);
  return result;
}

export async function renameVaultItem(id: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vaultItems).set({ name, updatedAt: new Date() }).where(eq(vaultItems.id, id));
}

export async function deleteVaultItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Supprimer récursivement les enfants
  const children = await db.select().from(vaultItems).where(eq(vaultItems.parentId, id));
  for (const child of children) {
    await deleteVaultItem(child.id);
  }
  await db.delete(vaultItems).where(eq(vaultItems.id, id));
}

export async function moveVaultItem(id: number, newParentId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vaultItems).set({ parentId: newParentId ?? undefined, updatedAt: new Date() }).where(eq(vaultItems.id, id));
}

export async function touchVaultItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(vaultItems).set({ lastAccessedAt: new Date() }).where(eq(vaultItems.id, id));
}
