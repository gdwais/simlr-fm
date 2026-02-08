import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Mock global fetch
  if (!global.fetch) {
    global.fetch = vi.fn();
  }
});

afterEach(() => {
  // Reset all mocks after each test
  vi.resetAllMocks();
});

afterAll(() => {
  // Cleanup after all tests
});
