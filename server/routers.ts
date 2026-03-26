import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllItems,
  getRecentFiles,
  getVaultItemById,
  getVaultItems,
  createVaultItem,
  renameVaultItem,
  deleteVaultItem,
  moveVaultItem,
  touchVaultItem,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  vault: router({
    // Lister les éléments d'un dossier (null = racine)
    list: publicProcedure
      .input(z.object({ parentId: z.number().nullable().default(null) }))
      .query(({ input }) => getVaultItems(input.parentId)),

    // Fichiers récemment utilisés
    recent: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(({ input }) => getRecentFiles(input.limit)),

    // Tous les fichiers (vue globale)
    all: publicProcedure.query(() => getAllItems()),

    // Infos d'un item
    info: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        await touchVaultItem(input.id);
        return getVaultItemById(input.id);
      }),

    // Créer un dossier
    createFolder: publicProcedure
      .input(z.object({ name: z.string().min(1), parentId: z.number().nullable().default(null) }))
      .mutation(async ({ input }) => {
        await createVaultItem({
          name: input.name,
          type: "folder",
          parentId: input.parentId ?? undefined,
        });
        return { success: true };
      }),

    // Renommer
    rename: publicProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await renameVaultItem(input.id, input.name);
        return { success: true };
      }),

    // Supprimer (récursif pour les dossiers)
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteVaultItem(input.id);
        return { success: true };
      }),

    // Déplacer
    move: publicProcedure
      .input(z.object({ id: z.number(), newParentId: z.number().nullable() }))
      .mutation(async ({ input }) => {
        await moveVaultItem(input.id, input.newParentId);
        return { success: true };
      }),

    // Upload : le client envoie le fichier en base64, on l'upload sur S3
    upload: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        parentId: z.number().nullable().default(null),
        mimeType: z.string().default("application/octet-stream"),
        fileSize: z.number(),
        base64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const suffix = nanoid(8);
        const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `vault/${suffix}-${safeFileName}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);

        await createVaultItem({
          name: input.name,
          type: "file",
          parentId: input.parentId ?? undefined,
          s3Key: key,
          s3Url: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        });

        return { success: true, url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
