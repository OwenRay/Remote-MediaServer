import { useEffect, useState } from 'react';
import * as offline from '@/src/features/shared/model/offline';

export function useOfflineUri(id: string | undefined) {
  const [offlineUri, setOfflineUri] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return setOfflineUri(undefined);
        const uri = await offline.getUri(String(id));
        if (mounted) setOfflineUri(uri);
      } catch {
        if (mounted) setOfflineUri(undefined);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return offlineUri;
}
