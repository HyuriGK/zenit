import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Configura o WebSocket para o driver do Neon em ambientes Node.js (necessário para o Pool)
if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Inicializa o Pool e o Adapter apenas se estivermos em ambiente servidor
let prismaInstance: PrismaClient

if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
} else {
    const connectionString = process.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    prismaInstance = new PrismaClient({ adapter })
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma;