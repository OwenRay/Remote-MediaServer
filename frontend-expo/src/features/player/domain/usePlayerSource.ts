import { useMemo } from 'react';
import { getBaseUrl } from '@/src/features/shared/model/api/base';

export type PlayerSource = { uri: string } | { uri?: string } | any;

export function usePlayerSource(id: string | undefined, position: number, offlineUri?: string): PlayerSource {
  return useMemo(() => {
    if (offlineUri) return { uri: offlineUri } satisfies PlayerSource;
    const seek = Math.floor(position);
    if (!id) return { uri: '' } as PlayerSource;
    return { uri: `${getBaseUrl()}/ply/${id}/${seek}` } satisfies PlayerSource;
  }, [id, position, offlineUri]);
}
