import { api } from '@/src/features/shared/model/api/base';
import { z } from 'zod';
import { MediaItemSchema, type MediaItem } from '@/src/features/library/model/media';

// The home endpoint returns four buckets of items
// matching the legacy /api/watchNext: continueWatching, recommended, newMovies, newTV
const JsonApiResource = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  relationships: z.record(z.any()).optional(),
});

const JsonApiList = z.object({
  data: z.array(JsonApiResource).default([]),
  included: z.array(z.any()).optional(),
  meta: z.record(z.any()).optional(),
});

const HomeResponseSchema = z.object({
  continueWatching: JsonApiList.optional(),
  recommended: JsonApiList.optional(),
  newMovies: JsonApiList.optional(),
  newTV: JsonApiList.optional(),
});

export type HomeRows = {
  continueWatching: MediaItem[];
  recommended: MediaItem[];
  newMovies: MediaItem[];
  newTV: MediaItem[];
};

function resolvePlayPositionFromIncluded(item: any, included?: any[]): { position: number; watched: boolean } | undefined {
  const rel = item?.relationships?.['play-position']?.data;
  const relId: string | undefined = rel?.id ? String(rel.id) : undefined;

  if (Array.isArray(included)) {
    if (relId) {
      const match = included.find((inc: any) => (inc?.type === 'play-positions' || inc?.type === 'play-position') && String(inc?.id) === relId);
      const attrs = match?.attributes;
      if (attrs) {
        return {
          position: Number(attrs.position ?? 0),
          watched: Boolean(attrs.watched),
        };
      }
    } else {
      const all = included.filter((inc: any) => inc?.type === 'play-positions' || inc?.type === 'play-position');
      if (all.length === 1 && all[0]?.attributes) {
        return {
          position: Number(all[0].attributes.position ?? 0),
          watched: Boolean(all[0].attributes.watched),
        };
        }
    }
  }
  return undefined;
}

const homeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHome: build.query<HomeRows, void>({
      query: () => ({ url: '/watchNext' }),
      transformResponse: (response: unknown): HomeRows => {
        const parsed = HomeResponseSchema.safeParse(response);
        const empty: MediaItem[] = [];
        if (!parsed.success) {
          return { continueWatching: empty, recommended: empty, newMovies: empty, newTV: empty };
        }
        const mapList = (lst: z.infer<typeof JsonApiList> | undefined): MediaItem[] => {
          const raw = lst?.data ?? [];
          const included = lst?.included as any[] | undefined;
          return raw.map((i) => {
            const mi = MediaItemSchema.parse(i) as MediaItem;
            const pp = resolvePlayPositionFromIncluded(i, included);
            if (pp) {
              (mi as any).playPosition = pp;
            }
            return mi;
          });
        };
        return {
          continueWatching: mapList(parsed.data.continueWatching),
          recommended: mapList(parsed.data.recommended),
          newMovies: mapList(parsed.data.newMovies),
          newTV: mapList(parsed.data.newTV),
        };
      },
      providesTags: () => ['Item'],
    }),
  }),
});

export const { useGetHomeQuery } = homeApi;
export type HomeRowKey = keyof HomeRows;
