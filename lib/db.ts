import { PrismaClient } from "@prisma/client"

/**
 * Re-usable Prisma client.
 * In development we attach the client to the global object to avoid
 * creating new connections on HMR / file-watch reloads.
 * In production a new client is created once per lambda / server instance.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = db
}
