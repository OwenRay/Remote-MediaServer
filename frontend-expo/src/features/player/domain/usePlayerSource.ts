import { useMemo } from 'react';
import { getBaseUrl } from '@/src/features/shared/model/api/base';

export type PlayerSource = { uri: string } | { uri?: string } | any;

export function usePlayerSource(
  id: string | undefined,
  position: number,
  offlineUri?: string,
  audioChannel?: number,
  videoChannel?: number,
): PlayerSource {
  return useMemo(() => {
    if (offlineUri) return { uri: offlineUri } satisfies PlayerSource;
    const seek = Math.floor(position);
    if (!id) return { uri: '' } as PlayerSource;
    const params: string[] = [];
    if (audioChannel !== undefined) params.push(`audioChannel=${audioChannel}`);
    if (videoChannel !== undefined) params.push(`videoChannel=${videoChannel}`);
    const qp = params.length ? `?${params.join('&')}` : '';
    return { uri: `${getBaseUrl()}/ply/${id}/${seek}${qp}` } satisfies PlayerSource;
  }, [id, position, offlineUri, audioChannel, videoChannel]);
}
