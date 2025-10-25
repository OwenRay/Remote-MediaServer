import { store } from '@/src/services/store';
import { mediaApi } from '@/src/services/api/media';

// Using msw server from jest.setup.ts

describe('mediaApi endpoints', () => {
  it('getItems returns a list of media items', async () => {
    const res = await store.dispatch(mediaApi.endpoints.getItems.initiate()).unwrap();
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty('title');
  });

  it('getLibraries returns a list of libraries', async () => {
    const res = await store.dispatch(mediaApi.endpoints.getLibraries.initiate()).unwrap();
    expect(res.map((l) => l.name)).toContain('Movies');
  });
});
