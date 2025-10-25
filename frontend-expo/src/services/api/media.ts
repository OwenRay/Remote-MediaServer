import { api, deserializeList, JsonApiListResponse } from '@/src/services/api/base';

export type Library = {
  id: string;
  name: string;
};

export type MediaItem = {
  id: string;
  title: string;
  thumbnailUrl?: string;
};

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
          'sort': 'season:ASC,episode:ASC',
          'join': 'play-position',
        };
        if (arg && 'libraryId' in arg && arg.libraryId) params['filter[library]'] = arg.libraryId;
        return { url: '/media-items', params };
      },
      transformResponse: (response: JsonApiListResponse<{ title: string; thumbnail?: string }>) =>
        deserializeList(response, (r) => ({
          id: r.id,
          title: r.attributes.title,
          thumbnailUrl: (r.attributes as any).thumbnail,
        })),
      providesTags: (result) =>
        result ? [...result.map((i) => ({ type: 'Item' as const, id: i.id })), 'Item'] : ['Item'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetLibrariesQuery, useGetItemsQuery } = mediaApi;
