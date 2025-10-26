import { endpoints } from '@/src/services/api/media';
import { store } from '@/src/services/store';

// Using msw server from jest.setup.ts

describe('mediaApi endpoints', () => {
  it('getItems returns a list of media items', async () => {
    const res = await store.dispatch(endpoints.getItemsPaged.initiate({offset:0, limit:10})).unwrap();
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0]).toHaveProperty('title');
  });

  it('getLibraries returns a list of libraries', async () => {
    const res = await store.dispatch(endpoints.getLibraries.initiate()).unwrap();
    expect(res.map((l) => l.name)).toContain('Movies');
  });
});
