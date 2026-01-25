// Prisma client singleton
// Note: Run `npx prisma generate` after setting up DATABASE_URL

let PrismaClient: any;
let prismaInstance: any;

try {
  // Try to import the actual Prisma client
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch {
  // Prisma client not generated yet - create a mock for build time
  PrismaClient = class MockPrismaClient {
    user = createMockModel();
    character = createMockModel();
    campaign = createMockModel();
    gameSession = createMockModel();
    npc = createMockModel();
    location = createMockModel();
    quest = createMockModel();
    account = createMockModel();
    session = createMockModel();
    verificationToken = createMockModel();

    $connect() {
      console.warn('Prisma client not initialized. Run `npx prisma generate` first.');
      return Promise.resolve();
    }

    $disconnect() {
      return Promise.resolve();
    }
  };
}

function createMockModel() {
  const notImplemented = () => {
    throw new Error('Prisma client not initialized. Run `npx prisma generate` and set DATABASE_URL.');
  };
  return {
    findUnique: notImplemented,
    findFirst: notImplemented,
    findMany: notImplemented,
    create: notImplemented,
    update: notImplemented,
    delete: notImplemented,
    deleteMany: notImplemented,
    updateMany: notImplemented,
    upsert: notImplemented,
    count: notImplemented,
    aggregate: notImplemented,
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: typeof prismaInstance | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// Export types for use in services (these will be replaced when Prisma is generated)
export type User = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Campaign = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  setting: string | null;
  status: string;
  worldState: any;
  createdAt: Date;
  updatedAt: Date;
};

export type GameSession = {
  id: string;
  campaignId: string;
  sessionNumber: number;
  status: string;
  summary: string | null;
  notes: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
