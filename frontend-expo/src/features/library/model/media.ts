import {api, deserializeList, JsonApiListResponse, getBaseUrl, JsonApiSingleResponse} from '@/src/features/shared/model/api/base';

import {z} from 'zod';

export type Library = {
  id: string;
  name: string;
};

export type PlayPosition = {
  position: number;
  watched: boolean;
};

const serieNumber = z.union([z.number(), z.boolean()])
  .nullish()
  .default(false)
  .transform(val => val == null ? undefined : val)
  .transform(val => typeof val === 'boolean' ? undefined : val).optional();
export const MediaItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  attributes: z.object({
    title: z.string().optional().default('Untitled'),
    season: serieNumber,
    episode: serieNumber,
    year: z.union([z.string(), z.number()]).nullish().transform(v => v?.toString() || undefined),
    fileduration: z.number().optional().default(0),
    overview: z.string().optional().default(''),
    rating: z.union([z.number(), z.string()]).nullish().transform(v => (v == null ? undefined : Number(v))).optional(),
    type: z.string().optional(),
    episodeTitle: z.string().optional(),
    'external-id': z.union([z.string(), z.number()]).nullish().transform(v => v?.toString() || undefined).optional(),
    filepath: z.string().optional(),
    mediaType: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    bitrate: z.string().optional().transform(v => parseInt(v ?? '0', 10)),
    filesize: z.number().optional(),
    date_added: z.number().optional(),
    release_date: z.string().optional(),
    'episode-title': z.string().optional(),

  })
}).transform((obj) => ({
  id: obj.id,
  ...obj.attributes,
  thumbnailUrl: `${getBaseUrl()}/img/${obj.id}_postersmall.jpg`,
  posterUrl: `${getBaseUrl()}/img/${obj.id}_poster.jpg`,
  posterLargeUrl: `${getBaseUrl()}/img/${obj.id}_posterlarge.jpg`,
  backdropUrl: `${getBaseUrl()}/img/${obj.id}_backdrop.jpg`,
  imdbUrl: obj.attributes['external-id'] ? `${getBaseUrl()}/api/redirectToIMDB/${obj.id}` : undefined,
  externalId: obj.attributes['external-id'],
  dateAdded: obj.attributes.date_added,
  releaseDate: obj.attributes.release_date,
  episodeTitle: obj.attributes['episode-title'],
  title: obj.attributes.title + (obj.attributes['episode-title'] ? ` • ${obj.attributes['episode-title']}` : ''),
}));


export type MediaItem = z.infer<typeof MediaItemSchema> & { playPosition?: PlayPosition };

async function resolvePlayPosition(
  itemResource: any,
  included: any[] | undefined,
  baseQueryFn?: (arg: any) => any
): Promise<PlayPosition | undefined> {
  console.log('resolvePlayPosition', itemResource, included);
  // Try to resolve via relationship linkage first
  const rel = itemResource?.relationships?.['play-position']?.data;
  const relId: string | undefined = rel?.id;

  // 1) If we have an id linkage, try to find the matching resource in included
  if (relId && Array.isArray(included)) {
    const ppInc = included.find(
      (inc: any) => (inc.type === 'play-positions' || inc.type === 'play-position') && String(inc.id) === String(relId)
    );
    const attrs = ppInc?.attributes;
    if (attrs) {
      return {
        position: Number(attrs.position ?? 0),
        watched: Boolean(attrs.watched),
      };
    }
  }

  // 2) If no relationship id is provided, but there's exactly one play-position in included, use it
  if (!relId && Array.isArray(included)) {
    const ppAll = included.filter((inc: any) => inc.type === 'play-positions' || inc.type === 'play-position');
    if (ppAll.length === 1 && ppAll[0]?.attributes) {
      return {
        position: Number(ppAll[0].attributes.position ?? 0),
        watched: Boolean(ppAll[0].attributes.watched),
      };
    }
  }

  // 3) Fallback to fetching by relationship id if available
  if (relId && baseQueryFn) {
    const res = await baseQueryFn({ url: `/play-positions/${relId}` });
    const data = res?.data?.data ?? res?.data; // support both shapes just in case
    const attrs = data?.attributes;
    if (attrs) {
      return {
        position: Number(attrs.position ?? 0),
        watched: Boolean(attrs.watched),
      };
    }
  }
  return undefined;
}

function toMediaItem(resource: any): MediaItem {
  return MediaItemSchema.parse(resource) as MediaItem;
}

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
      async queryFn(arg, _api, _extra, baseQuery) {
        const { offset, limit, libraryId, title, sort } = arg;
        const params: Record<string, string> = {
          extra: 'false',
          sort: sort ?? 'date_added:DESC',
          join: 'play-position',
          'page[offset]': String(offset),
          'page[limit]': String(limit),
        };
        if (libraryId) params['library'] = libraryId;
        if (title) params['title'] = `%${title}%`;
        const resp = await baseQuery({ url: '/media-items', params });
        if ((resp as any).error) return { error: (resp as any).error } as any;
        const response: any = (resp as any).data;
        const included = response?.included as any[] | undefined;
        const resources: any[] = (response?.data ?? []) as any[];
        const items: MediaItem[] = [];
        for (const res of resources) {
          const mi = toMediaItem(res);
          const pp = await resolvePlayPosition(res, included, (arg) => baseQuery(arg));
          if (pp) mi.playPosition = pp;
          items.push(mi);
        }
        const total = (response?.meta?.totalItems as number) ?? items.length;
        return { data: { items, total } };
      },
      providesTags: (result) =>
        result ? [...result.items.map((i) => ({ type: 'Item' as const, id: i.id })), 'Item'] : ['Item'],
    }),
    getItem: build.query<MediaItem, string>({
      async queryFn(id, _api, _extra, baseQuery) {
        console.log('getItem resolved');
        const resp = await baseQuery({ url: `/media-items/${id}`, params: { extra: 'false', join: 'play-position' } });
        if ((resp as any).error) return { error: (resp as any).error } as any;
        const response = (resp as any).data as JsonApiSingleResponse<any>;
        const itemRes = response.data as any;
        const included = response.included as any[] | undefined;
        const mi = toMediaItem(itemRes);
        const pp = await resolvePlayPosition(itemRes, included, (arg) => baseQuery(arg));
        if (pp) mi.playPosition = pp;
        return { data: mi };
      },
      providesTags: (result) =>
        result ? [{type: 'Item' as const, id: result.id}] : ['Item'],
    }),
    getEpisodesByExternalId: build.query<MediaItem[], { externalId: string } | string>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const externalId = typeof arg === 'string' ? arg : arg.externalId;
        const resp = await baseQuery({ url: '/media-items', params: { 'external-id': externalId, sort: 'season,episode', join: 'play-position', extra: 'false' } });
        if ((resp as any).error) return { error: (resp as any).error } as any;
        const response: any = (resp as any).data;
        const included = response?.included as any[] | undefined;
        const resources: any[] = (response?.data ?? []) as any[];
        const list: MediaItem[] = [];
        for (const res of resources) {
          const mi = toMediaItem(res);
          const pp = await resolvePlayPosition(res, included, (a) => baseQuery(a));
          if (pp) mi.playPosition = pp;
          list.push(mi);
        }
        return { data: list };
      },
      providesTags: (result) => result ? [...result.map(i => ({ type: 'Item' as const, id: i.id })), 'Item'] : ['Item'],
    }),
  }),
  overrideExisting: false,
});

export const {useGetLibrariesQuery, useGetItemQuery, useLazyGetItemsPagedQuery, useGetEpisodesByExternalIdQuery, endpoints} = mediaApi;
