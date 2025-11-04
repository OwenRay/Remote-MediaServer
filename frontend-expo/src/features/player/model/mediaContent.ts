import { api } from '@/src/features/shared/model/api/base';

export type MediaContentOption<T = number | string> = {
  label: string;
  value: T;
};

export type MediaContent = {
  audio: MediaContentOption<number>[];
  video: MediaContentOption<number>[];
  subtitles: MediaContentOption<string>[];
};

const mediaContentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMediaContent: build.query<MediaContent, string>({
      query: (id) => ({ url: `/mediacontent/${id}` }),
      transformResponse: (resp: any): MediaContent => {
        // Accept backend raw object directly
        return {
          audio: Array.isArray(resp?.audio) ? resp.audio : [],
          video: Array.isArray(resp?.video) ? resp.video : [],
          subtitles: Array.isArray(resp?.subtitles) ? resp.subtitles : [],
        } as MediaContent;
      },
      providesTags: (_res, _err, id) => [{ type: 'MediaContent' as const, id }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMediaContentQuery } = mediaContentApi;
