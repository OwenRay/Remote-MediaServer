import { setupServer } from 'msw/native';
import { http, HttpResponse } from 'msw';

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
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
