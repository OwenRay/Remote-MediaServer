import { useMemo } from 'react';
import type { MediaItem } from '@/src/features/library/model/media';

export function useResumeGate(data: MediaItem | undefined, resumeConfirmed: boolean) {
  return useMemo(() => {
    const resumePos = data?.playPosition?.position ?? 0;
    const watched = Boolean(data?.playPosition?.watched);
    return resumePos >= 5 && !watched && !resumeConfirmed;
  }, [data?.playPosition?.position, data?.playPosition?.watched, resumeConfirmed]);
}
