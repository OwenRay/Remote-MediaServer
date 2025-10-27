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
  // List endpoint
  http.get('*/api/media-items', () => HttpResponse.json(items)),
  // Details endpoint
  http.get('*/api/media-items/:id', ({ params }) => {
    const id = String((params as any).id);
    const found = (items.data as any[]).find((i) => i.id === id) ?? items.data[0];
    return HttpResponse.json({ data: found });
  }),
  http.post('*/api/play-positions', async ({ request }) => {
    const body: any = await request.json();
    return HttpResponse.json({ data: { id: 'pp1', type: 'play-positions', attributes: body?.data?.attributes ?? {} } });
  }),
  // Settings endpoints for Task 9
  http.get('*/api/settings/1', () =>
    HttpResponse.json({ data: { id: 1, type: 'setting', attributes: {
      name: 'My Media Server',
      port: 8234,
      filewatcher: 'native',
      startscan: true,
      modules: ['debug','ffmpeg','filename','sharing','tmdb','ssl','socketio'],
      ssldomain: '',
      sslport: 8443,
      sslemail: '',
      sslredirect: false,
      sharehost: '',
      shareport: 8235,
      sharespace: 15,
      libraries: [],
      dbKey: 'dbk',
      dbNonce: 'dbn',
      sharekey: 'shk',
      advanced: false,
    } } })
  ),
  http.patch('*/api/settings/1', async ({ request }) => {
    const body: any = await request.json();
    // Echo back attributes merged with defaults
    const attrs = body?.data?.attributes ?? {};
    return HttpResponse.json({ data: { id: 1, type: 'setting', attributes: {
      name: 'My Media Server',
      port: 8234,
      filewatcher: 'native',
      startscan: true,
      modules: ['debug','ffmpeg','filename','sharing','tmdb','ssl','socketio'],
      libraries: [],
      ...attrs,
      dbKey: 'dbk',
      dbNonce: 'dbn',
      sharekey: 'shk',
    } } });
  }),
  http.get('*/api/modules', () => HttpResponse.json(['debug','ffmpeg','filename','sharing','tmdb','ssl','socketio']))
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

// Provide minimal mocks for native-only components in tests
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => children,
}));
// Mock AsyncStorage for Jest to avoid native module errors
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const IconProxy = new Proxy({}, {
    get: () => ({ name = 'Icon', color = 'black', size = 16 }: any) => React.createElement(Text, { accessibilityLabel: name, style: { color, fontSize: size } }, 'icon'),
  });
  return IconProxy;
});
// Simplify ThemedText during tests
jest.mock('@/src/features/shared/view/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { ThemedText: (props: any) => React.createElement(Text, props) };
});

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
