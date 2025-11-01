import {api, JsonApiSingleResponse} from '@/src/features/shared/model/api/base';

export type PlayPositionAttributes = {
  position: number; // seconds
  watched: boolean;
};

export type PlayPositionResource = {
  id?: string;
  type: 'play-positions';
  attributes: PlayPositionAttributes;
};

export type WritePlayPositionArg = {
  mediaItemId: string;
  position: number;
  duration: number;
};

export const playbackApi = api.injectEndpoints({
  endpoints: (build) => ({
    writePlayPosition: build.mutation<
      JsonApiSingleResponse<PlayPositionAttributes>,
      WritePlayPositionArg
    >({
      async queryFn({mediaItemId, position, duration}, _api, _extra, baseQuery) {
        const watched = position >= duration * 0.97;
        // 1) Create play-position without linking it to media item
        const createResp: any = await baseQuery({
          url: '/play-positions',
          method: 'POST',
          body: {
            data: {
              type: 'play-positions',
              attributes: {position, watched},
            } as PlayPositionResource,
          },
        });
        if (createResp.error) return {error: createResp.error} as any;
        const created = (createResp.data as JsonApiSingleResponse<PlayPositionAttributes>)?.data as any;
        const playPositionId = created?.id;
        if (!playPositionId) return {error: {status: 500, data: 'Missing play-position id'}} as any;
        // 2) Link the play-position from the media item side
        const linkResp: any = await baseQuery({
          url: `/media-items/${mediaItemId}`,
          method: 'PATCH',
          body: {
            data: {
              type: 'media-items',
              id: mediaItemId,
              relationships: {
                'play-position': {data: {type: 'play-positions', id: playPositionId}},
              },
            },
          },
        });
        if (linkResp.error) return {error: linkResp.error} as any;
        // Return the created play-position response to keep API stable
        return {data: createResp.data} as { data: JsonApiSingleResponse<PlayPositionAttributes> };
      },
    }),
  }),
  overrideExisting: false,
});

export const {useWritePlayPositionMutation} = playbackApi;
