import { api, JsonApiSingleResponse } from '@/src/features/shared/model/api/base';

export type SettingsAttributes = {
  // Exact fields as used in legacy Settings.js UI
  name: string;
  port: number;
  filewatcher: 'native' | 'polling';
  startscan: boolean;
  modules: string[];
  // SSL (conditional)
  ssldomain?: string;
  sslport?: number;
  sslemail?: string;
  sslredirect?: boolean;
  // Sharing (conditional)
  sharehost?: string;
  shareport?: number;
  sharespace?: number;
  // Libraries
  libraries: {
    uuid?: string;
    name?: string;
    type?: string;
    folder?: string;
    shared?: boolean;
  }[];
  // Keys displayed read-only
  dbKey?: string;
  dbNonce?: string;
  sharekey?: string;
  // Advanced UI toggle exists in legacy
  advanced?: boolean;
};

export type SettingsResource = {
  id: string | number;
  type: 'setting';
  attributes: SettingsAttributes;
};

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<SettingsAttributes, void>({
      query: () => ({ url: '/settings/1', method: 'GET' }),
      transformResponse: (resp: JsonApiSingleResponse<SettingsAttributes>) => resp?.data?.attributes ?? ({} as any),
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<SettingsAttributes, Partial<SettingsAttributes>>({
      query: (patch) => ({
        url: '/settings/1',
        method: 'PATCH',
        body: {
          data: {
            id: 1,
            type: 'setting',
            attributes: patch,
          },
        },
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (resp: JsonApiSingleResponse<SettingsAttributes>) => resp?.data?.attributes ?? ({} as any),
    }),
    getModules: build.query<string[], void>({
      query: () => ({ url: '/modules', method: 'GET' }),
      transformResponse: (resp: any) => Array.isArray(resp) ? resp : [],
      providesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation, useGetModulesQuery } = settingsApi;
