import React, {useCallback, useEffect, useState} from 'react';
import {default as styled} from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as offline from '@/src/features/shared/model/offline';

export type DownloadButtonProps = { id?: string | number };

export function DownloadButton({id}: DownloadButtonProps) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return setAvailable(false);
      try {
        const ok = await offline.isAvailable(String(id));
        if (mounted) setAvailable(ok);
      } catch {
        if (mounted) setAvailable(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const toggle = useCallback(async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      if (available) await offline.remove(String(id));
      else await offline.download(String(id));
      const ok = await offline.isAvailable(String(id));
      setAvailable(ok);
    } finally {
      setBusy(false);
    }
  }, [id, available, busy]);

  if (!offline.isSupported || !id) return null;

  return (
    <IconBtn accessibilityLabel={available ? 'Remove download' : 'Download for offline'} onPress={toggle} disabled={busy}>
      <MaterialIcons name={available ? 'delete' : 'file-download'} size={24} color={'white'} />
    </IconBtn>
  );
}

const IconBtn = styled.TouchableOpacity`
  padding: 8px;
`;

