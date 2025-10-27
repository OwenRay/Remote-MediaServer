import { api, JsonApiSingleResponse } from '@/src/services/api/base';

export type PlayPositionAttributes = {
  position: number; // seconds
  watched: boolean;
  // Optionally could include media-item relation, but backend may infer from body
};

export type PlayPositionResource = {
  id?: string;
  type: 'play-positions';
  attributes: PlayPositionAttributes;
  relationships?: {
    'media-item'?: {
      data: { type: 'media-items'; id: string };
    };
  };
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
      query: ({ mediaItemId, position, duration }) => {
        const watched = position >= duration * 0.97;
        const body: { data: PlayPositionResource } = {
          data: {
            type: 'play-positions',
            attributes: { position, watched },
            relationships: {
              'media-item': { data: { type: 'media-items', id: mediaItemId } },
            },
          },
        };
        return {
          url: '/play-positions',
          method: 'POST',
          body,
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useWritePlayPositionMutation } = playbackApi;
