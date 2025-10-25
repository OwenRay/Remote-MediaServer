import { setupServer } from 'msw/native';
import { http, HttpResponse } from 'msw';
import { cleanup } from '@testing-library/react-native';

// Basic JSON:API sample data for tests
const libraries = {
  data: [
    { id: 'lib1', type: 'libraries', attributes: { name: 'Movies' } },
    { id: 'lib2', type: 'libraries', attributes: { name: 'Shows' } },
  ],
};

const items = {
  data: [
    {
      id: 'itm1',
      type: 'media-items',
      attributes: { title: 'Example Video 1', thumbnail: 'https://example.com/1.jpg' },
    },
    {
      id: 'itm2',
      type: 'media-items',
      attributes: { title: 'Example Video 2', thumbnail: 'https://example.com/2.jpg' },
    },
  ],
};

export const server = setupServer(
  http.get('*/api/libraries', () => HttpResponse.json(libraries)),
  http.get('*/api/media-items', () => HttpResponse.json(items))
);

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  // Cleanup mounted components and React trees
  cleanup();
  server.resetHandlers();
  // Drain and clear timers to avoid RN teardown leaks
  try {
    // @ts-ignore
    if (typeof jest !== 'undefined') {
      jest.runOnlyPendingTimers?.();
      jest.advanceTimersByTime?.(1000);
      jest.runOnlyPendingTimers?.();
      jest.clearAllTimers?.();
    }
  } catch {}
});

// Clean up after the tests are finished.
afterAll(() => server.close());

const originalConsoleWarn = console.warn;
let reanimatedWarnSpy: jest.SpyInstance | undefined;

beforeAll(() => {
  // Silence noisy Reanimated warning during tests. This warning is expected in test env
  // because no real scrollable with animatedRef is mounted.
  reanimatedWarnSpy = jest.spyOn(console, 'warn').mockImplementation((...args: any[]) => {
    const [message] = args;
    if (
      typeof message === 'string' &&
      message.startsWith('[Reanimated]') &&
      message.includes('animatedRef is not initialized in useScrollOffset')
    ) {
      return;
    }
    return originalConsoleWarn(...(args as Parameters<typeof console.warn>));
  });
});

afterAll(() => {
  reanimatedWarnSpy?.mockRestore();
});
