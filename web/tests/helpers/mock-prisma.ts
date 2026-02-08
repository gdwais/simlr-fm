import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

/**
 * Creates a mock PrismaClient for testing
 */
export function createMockPrisma(): PrismaClient {
  return {
    album: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    rating: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
    $connect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * Resets all mock functions on a PrismaClient
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetMockPrisma(prisma: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values(prisma).forEach((model: any) => {
    if (typeof model === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(model).forEach((fn: any) => {
        if (typeof fn?.mockReset === 'function') {
          fn.mockReset();
        }
      });
    }
  });
}
