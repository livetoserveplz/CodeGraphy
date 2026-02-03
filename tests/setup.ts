import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock vis-network (requires canvas which jsdom doesn't support)
vi.mock('vis-network', () => import('./__mocks__/vis-network'));
vi.mock('vis-data', () => import('./__mocks__/vis-data'));

// Clean up mocks after each test to prevent memory leaks
afterEach(async () => {
  // Dynamic import to get the mocked modules
  const { Network } = await import('./__mocks__/vis-network');
  const { DataSet } = await import('./__mocks__/vis-data');
  
  Network.clearAllHandlers();
  Network.clearMockPositions();
  DataSet.clearAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__vscodeSentMessages = [];
});

// Track messages sent to extension - globally accessible for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__vscodeSentMessages = [] as unknown[];

// Mock acquireVsCodeApi with message tracking
vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: (message: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__vscodeSentMessages.push(message);
  },
  getState: vi.fn(),
  setState: vi.fn(),
}));
