import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { getApiBaseUrl, getBaseUrl } from '@/src/services/serverConfig';

// Expose getters for dynamic server URL
export { getBaseUrl } from '@/src/services/serverConfig';
export { getApiBaseUrl } from '@/src/services/serverConfig';

// @todo recreate after url change
export const baseQuery: BaseQueryFn = async (args, api, extraOptions) => {
  const dynamicBaseQuery = fetchBaseQuery({
    baseUrl: getApiBaseUrl(), // ← Now called on every request
    prepareHeaders: (headers) => {
      return headers;
    },
  });

  return dynamicBaseQuery(args, api, extraOptions);
};

export const api = createApi({
  baseQuery,
  endpoints: () => ({}),
  tagTypes: ['Library', 'Item', 'MediaContent', 'Settings'],
  keepUnusedDataFor: 0,
  refetchOnFocus: false,
  refetchOnReconnect: false,
});

export type JsonApiResource<TAttr = Record<string, unknown>> = {
  id: string;
  type: string;
  attributes: TAttr;
  relationships?: Record<string, unknown>;
};

export type JsonApiListResponse<TAttr> = {
  data: JsonApiResource<TAttr>[];
  included?: JsonApiResource<any>[];
  meta?: Record<string, unknown>;
};

export type JsonApiSingleResponse<TAttr> = {
  data: JsonApiResource<TAttr>;
  included?: JsonApiResource<any>[];
  meta?: Record<string, unknown>;
};

// Minimal JSON:API deserializer for lists we need in Task 4
export function deserializeList<TAttr extends Record<string, any>, TOut>(
  resp: JsonApiListResponse<TAttr>,
  map: (r: JsonApiResource<TAttr>) => TOut
): TOut[] {
  if (!resp || !Array.isArray(resp.data)) return [];
  return resp.data.map(map);
}
