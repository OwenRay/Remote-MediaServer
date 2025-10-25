import {api, deserializeList, JsonApiListResponse, BASE_URL} from '@/src/services/api/base';

import {z} from 'zod';

export type Library = {
  id: string;
  name: string;
};

export const MediaItemSchema = z.object({
  id: z.string(),
  attributes: z.object({
    title: z.string().optional().default('Untitled'),
    season: z.union([z.number(), z.boolean()]).transform(val => typeof val === 'boolean' ? undefined : val).optional(),
    episode: z.union([z.number(), z.boolean()]).transform(val => typeof val === 'boolean' ? undefined : val).optional()
  })
}).transform((obj) => ({
  id: obj.id,
  ...obj.attributes,
  thumbnailUrl: `${BASE_URL}/img/${obj.id}_postersmall.jpg`
})).transform((obj) => ({
  ...obj,
  title: obj.season !== undefined && obj.episode !== undefined
    ? `${obj.title} S${obj.season.toString().padStart(2, '0')}E${obj.episode.toString().padStart(2, '0')}`
    : obj.title,
}));


export type MediaItem = z.infer<typeof MediaItemSchema>;

export const mediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    getLibraries: build.query<Library[], void>({
      query: () => ({ url: '/libraries' }),
      transformResponse: (response: JsonApiListResponse<{ name: string }>) =>
        deserializeList(response, (r) => ({ id: r.id, name: r.attributes.name })),
      providesTags: (result) =>
        result ? [...result.map((l) => ({ type: 'Library' as const, id: l.id })), 'Library'] : ['Library'],
    }),
    getItems: build.query<MediaItem[], { libraryId?: string } | void>({
      query: (arg) => {
        const params: Record<string, string> = {
          'extra': 'false',
          'sort': 'date_added:DESC',
          'join': 'play-position',
          'page[offset]': '0',
          'page[limit]': '100'
        };
        if (arg && 'libraryId' in arg && arg.libraryId) params['filter[library]'] = arg.libraryId;
        return { url: '/media-items', params };
      },
      transformResponse: (response: JsonApiListResponse<MediaItem>) => response.data.map(i => MediaItemSchema.parse(i)),
      providesTags: (result) =>
        result ? [...result.map((i) => ({ type: 'Item' as const, id: i.id })), 'Item'] : ['Item'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetLibrariesQuery, useGetItemsQuery } = mediaApi;
