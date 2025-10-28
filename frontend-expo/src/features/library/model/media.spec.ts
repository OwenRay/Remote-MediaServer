import { endpoints } from './media';
import {store} from '../../shared/model/store';
import { server } from '@/jest.setup';
import { http, HttpResponse } from 'msw';

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

  it('getItem resolves missing play-position by fetching relationship', async () => {
    // Arrange: media-item detail without included but with relationship link to play-position
    server.use(
      http.get('*/api/media-items/:id', ({ params }) => {
        const id = String((params as any).id);
        return HttpResponse.json({
          data: {
            id,
            type: 'media-items',
            attributes: { title: 'Detail with rel only' },
            relationships: {
              'play-position': { data: { type: 'play-position', id: 'pp-123' } },
            },
          },
          // No included here on purpose
        });
      }),
      http.get('*/api/play-positions/pp-123', () =>
        HttpResponse.json({ data: { id: 'pp-123', type: 'play-positions', attributes: { position: 42, watched: false } } })
      )
    );

    const res = await store.dispatch(endpoints.getItem.initiate('itm-rel-1')).unwrap();
    expect(res.title).toBe('Detail with rel only');
    expect(res.playPosition).toEqual({ position: 42, watched: false });
  });

  it('getItemsPaged resolves missing play-position for list items', async () => {
    // Arrange: list returns resources with relationship only, no included
    server.use(
      http.get('*/api/media-items', () =>
        HttpResponse.json({
          data: [
            {
              id: 'li1',
              type: 'media-items',
              attributes: { title: 'List Item 1' },
              relationships: { 'play-position': { data: { type: 'play-position', id: 'pp-li1' } } },
            },
            {
              id: 'li2',
              type: 'media-items',
              attributes: { title: 'List Item 2' },
              relationships: { 'play-position': { data: { type: 'play-position', id: 'pp-li2' } } },
            },
          ],
          // no included
          meta: { totalItems: 2 },
        })
      ),
      http.get('*/api/play-positions/pp-li1', () =>
        HttpResponse.json({ data: { id: 'pp-li1', type: 'play-positions', attributes: { position: 7, watched: false } } })
      ),
      http.get('*/api/play-positions/pp-li2', () =>
        HttpResponse.json({ data: { id: 'pp-li2', type: 'play-positions', attributes: { position: 0, watched: true } } })
      )
    );

    const res = await store.dispatch(endpoints.getItemsPaged.initiate({ offset: 100, limit: 10 })).unwrap();
    expect(res.items).toHaveLength(2);
    expect(res.items[0].playPosition).toEqual({ position: 7, watched: false });
    expect(res.items[1].playPosition).toEqual({ position: 0, watched: true });
    expect(res.total).toBe(2);
  });
});
