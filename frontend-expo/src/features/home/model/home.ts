import { api } from '@/src/features/shared/model/api/base';
import { z } from 'zod';
import { MediaItemSchema, type MediaItem } from '@/src/features/library/model/media';

// The home endpoint returns four buckets of items
// matching the legacy /api/watchNext: continueWatching, recommended, newMovies, newTV
const JsonApiResource = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string().optional(),
  attributes: z.record(z.any()).optional(),
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
          return raw.map((i) => MediaItemSchema.parse(i));
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
