import React from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetItemQuery, useGetEpisodesByExternalIdQuery, MediaItem } from '@/src/features/library/model/media';
import { useWritePlayPositionMutation } from '@/src/features/player/model/playback';

export type GroupedEpisodes = Record<string, MediaItem[]>;

export type DetailsViewModel = {
  isLoading: boolean;
  isError: boolean;
  item?: MediaItem;
  grouped?: GroupedEpisodes;
  activeSeason: string | number;
  setActiveSeason: (val: string | number) => void;
  infoVisible: boolean;
  setInfoVisible: (v: boolean) => void;
  watched: boolean;
  onToggleWatched: () => Promise<void>;
  minutes: number;
  subTitle?: string;
  progressPct: number;
  onPlay: () => void;
  onOpenImdb: () => void;
  onEpisodePress: (epId: string | number) => void;
  onCloseInfo: () => void;
  onOpenInfo: () => void;
};

export function useDetailsViewModel(id: string): DetailsViewModel {
  const router = useRouter();
  const { data: item, isLoading, isError } = useGetItemQuery(String(id));
  const [writePos] = useWritePlayPositionMutation();
  const [watched, setWatched] = React.useState<boolean>(false);
  const [infoVisible, setInfoVisible] = React.useState(false);
  const [activeSeason, setActiveSeason] = React.useState<string | number>('0');

  const { data: episodes } = useGetEpisodesByExternalIdQuery(item?.externalId ?? '', {
    skip: !item?.externalId,
  });

  const grouped = React.useMemo(() => {
    if((episodes?.length || 0) <= 1) return;
    const groups: Record<string, MediaItem[]> = {};
    (episodes ?? []).forEach((ep) => {
      const key = String(ep.season ?? 0);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ep);
    });
    Object.keys(groups).forEach((k) => groups[k].sort((a, b) => (Number(a.episode ?? 0) - Number(b.episode ?? 0))));
    return groups;
  }, [episodes]);

  React.useEffect(() => {
    setWatched(Boolean(item?.playPosition?.watched));
    if ((item?.type === 'tv') && item?.season != null) {
      setActiveSeason(String(item.season ?? '0'));
    } else {
      setActiveSeason('0');
    }
  }, [id, item?.playPosition?.watched, item?.season, item?.type]);

  const onToggleWatched = async () => {
    if (!item) return;
    const next = !watched;
    setWatched(next);
    try {
      await writePos({ mediaItemId: String(item.id), position: next ? (item.fileduration ?? 0) : 0, duration: item.fileduration ?? 0 }).unwrap();
    } catch {
      setWatched(!next);
    }
  };

  const minutes = Math.round((item?.fileduration ?? 0) / 60);
  const subTitle = item?.type === 'tv' && item?.episode ? `Episode ${item.episode}${item.episodeTitle ? ` - ${item.episodeTitle}` : ''}` : undefined;
  const position = item?.playPosition?.position ?? 0;
  const duration = item?.fileduration ?? 0;
  const progressPct = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;

  const onPlay = () => {
    if (!item) return;
    router.push(`/player/${item.id}`);
  };

  const onOpenImdb = () => {
    if (item?.imdbUrl) {
      Linking.openURL(item.imdbUrl);
    }
  };

  const onEpisodePress = (epId: string | number) => {
    router.push(`/details/${epId}`);
  };

  const onCloseInfo = () => setInfoVisible(false);
  const onOpenInfo = () => setInfoVisible(true);

  return {
    isLoading,
    isError,
    item,
    grouped,
    activeSeason,
    setActiveSeason,
    infoVisible,
    setInfoVisible,
    watched,
    onToggleWatched,
    minutes,
    subTitle,
    progressPct,
    onPlay,
    onOpenImdb,
    onEpisodePress,
    onCloseInfo,
    onOpenInfo,
  };
}

export type { MediaItem };
