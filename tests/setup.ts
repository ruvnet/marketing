/**
 * Test Setup
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Mock timers if needed
beforeAll(() => {
  // Setup global test configuration
});

afterAll(() => {
  // Cleanup
});

// Mock console for cleaner test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});
