import { vi } from 'vitest';

/**
 * Mock fetch response helper
 */
export function createMockResponse(data: unknown, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

/**
 * Mock fetch error helper
 */
export function createMockError(message: string) {
  return Promise.reject(new Error(message));
}

/**
 * Setup global fetch mock
 */
export function setupFetchMock() {
  global.fetch = vi.fn();
  return global.fetch;
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (global.fetch && typeof (global.fetch as any).mockReset === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockReset();
  }
}
