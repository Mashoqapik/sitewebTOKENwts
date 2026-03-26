import { bigint, boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Table principale pour les fichiers et dossiers du vault
export const vaultItems = mysqlTable("vault_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  type: mysqlEnum("type", ["file", "folder"]).notNull(),
  parentId: int("parentId"),
  // Pour les fichiers : URL S3, clé S3, taille, type MIME
  s3Key: varchar("s3Key", { length: 1024 }),
  s3Url: text("s3Url"),
  mimeType: varchar("mimeType", { length: 256 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  // Métadonnées
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VaultItem = typeof vaultItems.$inferSelect;
export type InsertVaultItem = typeof vaultItems.$inferInsert;
