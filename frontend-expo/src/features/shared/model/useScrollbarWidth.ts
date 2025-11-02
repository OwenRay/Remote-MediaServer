import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Returns the width of the vertical scrollbar on web. Returns 0 on native.
 * Updates on window resize to react to scrollbar visibility changes.
 */
export function useScrollbarWidth(): number {
  const isWeb = Platform.OS === 'web';

  const getWidth = useMemo(() => {
    if (!isWeb) {
      return () => 0;
    }
    return () => {
      try {
        const dw = (globalThis as any).document?.documentElement;
        const ww = (globalThis as any).window?.innerWidth ?? 0;
        const cw = dw?.clientWidth ?? ww;
        const diff = Math.max(0, ww - cw);
        return Number.isFinite(diff) ? diff : 0;
      } catch {
        return 0;
      }
    };
  }, [isWeb]);

  const [width, setWidth] = useState<number>(getWidth());

  useEffect(() => {
    if (!isWeb) return;
    const handle = () => setWidth(getWidth());
    (globalThis as any).window?.addEventListener?.('resize', handle);
    // Some browsers can change scrollbar visibility without resize (rare),
    // listen to orientationchange as a lightweight extra.
    (globalThis as any).window?.addEventListener?.('orientationchange', handle);
    // Initial sync in case of hydration timing.
    handle();
    return () => {
      (globalThis as any).window?.removeEventListener?.('resize', handle);
      (globalThis as any).window?.removeEventListener?.('orientationchange', handle);
    };
  }, [isWeb, getWidth]);

  return width;
}
