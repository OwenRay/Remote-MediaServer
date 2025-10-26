import {api, deserializeList, JsonApiListResponse, BASE_URL} from '@/src/services/api/base';

import {z} from 'zod';

export type Library = {
  id: string;
  name: string;
};

const serieNumber = z.union([z.number(), z.boolean()])
  .nullish()
  .default(false)
  .transform(val => val == null ? undefined : val)
  .transform(val => typeof val === 'boolean' ? undefined : val).optional();
export const MediaItemSchema = z.object({
  id: z.string(),
  attributes: z.object({
    title: z.string().optional().default('Untitled'),
    season: serieNumber,
    episode: serieNumber,
    year: z.union([z.string(), z.number()]).transform(v => v.toString()).optional(),
    fileduration: z.number().optional().default(0),
  })
}).transform((obj) => ({
  id: obj.id,
  ...obj.attributes,
  thumbnailUrl: `${BASE_URL}/img/${obj.id}_postersmall.jpg`
}));


export type MediaItem = z.infer<typeof MediaItemSchema>;

const mediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    getLibraries: build.query<Library[], void>({
      query: () => ({ url: '/libraries' }),
      transformResponse: (response: JsonApiListResponse<{ name: string }>) =>
        deserializeList(response, (r) => ({ id: r.id, name: r.attributes.name })),
      providesTags: (result) =>
        result ? [...result.map((l) => ({ type: 'Library' as const, id: l.id })), 'Library'] : ['Library'],
    }),
    getItemsPaged: build.query<{ items: MediaItem[]; total: number }, { offset: number; limit: number; libraryId?: string; title?: string; sort?: string }>({
      query: ({ offset, limit, libraryId, title, sort }) => {
        const params: Record<string, string> = {
          'extra': 'false',
          'sort': sort ?? 'date_added:DESC',
          'join': 'play-position',
          'page[offset]': String(offset),
          'page[limit]': String(limit),
        };
        if (libraryId) params['filter[library]'] = libraryId;
        if (title) params['filter[title]'] = `%${title}%`;
        return { url: '/media-items', params };
      },
      transformResponse: (response: any) => {
        const items = (response?.data ?? []).map((i: any) => MediaItemSchema.parse(i));
        const total = (response?.meta?.totalItems as number) ?? items.length;
        return { items, total };
      },
      providesTags: (result) =>
        result ? [...result.items.map((i) => ({ type: 'Item' as const, id: i.id })), 'Item'] : ['Item'],
    }),
    getItem: build.query<MediaItem, string>({
      query: (id) => ({url: `/media-items/${id}`}),
      transformResponse: (response: { data: any }) => MediaItemSchema.parse(response.data),
      providesTags: (result) =>
        result ? [{type: 'Item' as const, id: result.id}] : ['Item'],
    }),
  }),
  overrideExisting: false,
});

export const {useGetLibrariesQuery, useGetItemQuery, useLazyGetItemsPagedQuery, endpoints} = mediaApi;
