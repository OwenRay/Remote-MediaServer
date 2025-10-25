import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use relative base URL; Expo dev server will proxy to backend if configured, otherwise
// expect the backend to be reachable at the same origin under /api during web dev.
export const BASE_URL = 'http://localhost:8234';
export const API_BASE_URL = `${BASE_URL}/api`;

export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    // Attach headers if needed (auth, etc.)
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  endpoints: () => ({}),
  tagTypes: ['Library', 'Item'],
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
