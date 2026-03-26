import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db helpers
vi.mock("./db", () => ({
  getVaultItems: vi.fn().mockResolvedValue([
    { id: 1, name: "Documents", type: "folder", parentId: null, s3Key: null, s3Url: null, mimeType: null, fileSize: null, lastAccessedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: "photo.jpg", type: "file", parentId: null, s3Key: "vault/abc-photo.jpg", s3Url: "https://cdn.example.com/photo.jpg", mimeType: "image/jpeg", fileSize: 204800, lastAccessedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ]),
  getRecentFiles: vi.fn().mockResolvedValue([
    { id: 2, name: "photo.jpg", type: "file", parentId: null, s3Key: "vault/abc-photo.jpg", s3Url: "https://cdn.example.com/photo.jpg", mimeType: "image/jpeg", fileSize: 204800, lastAccessedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ]),
  getAllItems: vi.fn().mockResolvedValue([]),
  getVaultItemById: vi.fn().mockResolvedValue({ id: 2, name: "photo.jpg", type: "file", parentId: null }),
  createVaultItem: vi.fn().mockResolvedValue({ insertId: 3 }),
  renameVaultItem: vi.fn().mockResolvedValue(undefined),
  deleteVaultItem: vi.fn().mockResolvedValue(undefined),
  moveVaultItem: vi.fn().mockResolvedValue(undefined),
  touchVaultItem: vi.fn().mockResolvedValue(undefined),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/vault/test-file.jpg", key: "vault/test-file.jpg" }),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("vault.list", () => {
  it("retourne les éléments du dossier racine", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.list({ parentId: null });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Documents");
    expect(result[0].type).toBe("folder");
  });
});

describe("vault.recent", () => {
  it("retourne les fichiers récents", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.recent({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].type).toBe("file");
  });
});

describe("vault.createFolder", () => {
  it("crée un dossier à la racine", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.createFolder({ name: "Nouveau Dossier", parentId: null });
    expect(result.success).toBe(true);
  });

  it("rejette un nom vide", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.vault.createFolder({ name: "", parentId: null })).rejects.toThrow();
  });
});

describe("vault.rename", () => {
  it("renomme un élément", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.rename({ id: 1, name: "Nouveau Nom" });
    expect(result.success).toBe(true);
  });
});

describe("vault.delete", () => {
  it("supprime un élément", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("vault.upload", () => {
  it("upload un fichier et retourne une URL", async () => {
    const caller = appRouter.createCaller(createCtx());
    // Petit PNG 1x1 en base64
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const result = await caller.vault.upload({
      name: "test.png",
      parentId: null,
      mimeType: "image/png",
      fileSize: 68,
      base64,
    });
    expect(result.success).toBe(true);
    expect(typeof result.url).toBe("string");
  });
});

describe("vault.move", () => {
  it("déplace un élément vers un autre dossier", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.vault.move({ id: 2, newParentId: 1 });
    expect(result.success).toBe(true);
  });
});
