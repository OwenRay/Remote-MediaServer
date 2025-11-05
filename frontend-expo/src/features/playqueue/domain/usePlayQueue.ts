import React from 'react';
import { useRouter } from 'expo-router';
import type { MediaItem } from '@/src/features/library/model/media';
import { useGetEpisodesByExternalIdQuery } from '@/src/features/library/model/media';

export type PlayQueueState = {
  offset: number;
  items: MediaItem[];
  playerVisible: boolean;
  loading?: boolean | string | number;
  playing?: MediaItem | null;
  hasNext: boolean;
  hasPrev: boolean;
  // internal flag to know we should populate queue with episodes for TV series
  needsPopulateExternalId?: string;
};

export type PlayQueueActions = {
  skip: (by: number) => void;
  hidePlayer: () => void;
  insertAtCurrentOffset: (item: MediaItem) => void;
  insertAtCurrentOffsetById: (id: string | number) => void;
};

const defaultState: PlayQueueState = {
  offset: 0,
  items: [],
  playerVisible: false,
  loading: false,
  playing: null,
  hasNext: false,
  hasPrev: false,
};

// Simple module-scoped store with subscription
let state: PlayQueueState = { ...defaultState };
const listeners = new Set<() => void>();

function emit() {
  // compute derived fields
  const playing = state.offset <= state.items.length - 1 ? state.items[state.offset] : null;
  state = {
    ...state,
    playing,
    hasNext: state.offset < state.items.length - 1,
    hasPrev: state.offset > 0,
  };
  listeners.forEach((l) => l());
}

function setState(partial: Partial<PlayQueueState> | ((s: PlayQueueState) => Partial<PlayQueueState>)) {
  const patch = typeof partial === 'function' ? (partial as (s: PlayQueueState) => Partial<PlayQueueState>)(state) : partial;
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function usePlayQueue(): { state: PlayQueueState; actions: PlayQueueActions } {
  const router = useRouter();
  const snap = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Populate TV episodes if needed
  const needsPopulateId = snap.needsPopulateExternalId;
  const { data: episodes } = useGetEpisodesByExternalIdQuery(needsPopulateId ?? '', {
    skip: !needsPopulateId,
  });

  React.useEffect(() => {
    if (!needsPopulateId) return;
    if (!episodes || episodes.length === 0) return;
    const currentId = snap.playing?.id;
    const items = episodes;
    const offset = Math.max(0, items.findIndex((e) => String(e.id) === String(currentId)));
    setState({ items, offset, loading: false, needsPopulateExternalId: undefined, playerVisible: true });
  }, [episodes, needsPopulateId, snap.playing?.id]);


  const actions = React.useMemo<PlayQueueActions>(() => ({
    skip: (by: number) => {
      setState((s) => {
        let nextOffset = s.offset + by;
        if (nextOffset < 0) nextOffset = 0;
        if (nextOffset >= s.items.length) nextOffset = Math.max(0, s.items.length - 1);
        return { offset: nextOffset };
      });
    },
    hidePlayer: () => setState({ playerVisible: false, loading: false }),
    insertAtCurrentOffset: (item: MediaItem) => {
      setState((s) => {
        const items = [...s.items];
        items.splice(s.offset, 0, item);
        const shouldPopulate = (item.type === 'tv' || item.mediaType === 'tv') && !!item.externalId;
        return {
          items,
          playerVisible: true,
          loading: false,
          needsPopulateExternalId: shouldPopulate ? String(item.externalId) : undefined,
        };
      });
    },
    insertAtCurrentOffsetById: (id: string | number) => {
      // In the new frontend, details screen fetches the item already. For minimal implementation, we just navigate to the player
      // The play screen will fetch item data again as needed via its own hooks
      setState({ playerVisible: true, loading: id });
      try {
        router.replace(`/player/${id}`);
      } catch {
        router.push(`/player/${id}`);
      }
    },
  }), [router]);

  return { state: snap, actions };
}
