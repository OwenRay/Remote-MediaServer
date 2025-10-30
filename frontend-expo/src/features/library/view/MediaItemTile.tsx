import React, { useState } from 'react';
import { Platform } from 'react-native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import type { MediaItem } from '@/src/features/library/model/media';
import { BlurView } from 'expo-blur';
import {default as styled} from 'styled-components/native';
import { useRouter } from 'expo-router';

import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { ProgressBar as SharedProgressBar } from '@/src/features/shared/view/ProgressBar';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type MediaItemTileProps = {
  item: MediaItem & Partial<{ playPos: number }>;
  width?: number; // cell width (default 150)
  height?: number; // cell height (default 218)
};

export function MediaItemTile({ item, width = 150, height = 218 }: MediaItemTileProps) {
  const router = useRouter();
  const hasThumb = !!item.thumbnailUrl;
  const season = typeof item.season === 'number' ? item.season : undefined;
  const episode = typeof item.episode === 'number' ? item.episode : undefined;
  const seasonEpisode = season !== undefined && episode !== undefined
    ? `s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`
    : undefined;

  const fileduration = item.fileduration ?? 0;
  const playPos = (item.playPosition?.position ?? item.playPos ?? 0) as number;
  const progress = fileduration > 0 && playPos >= 0
    ? Math.min(1, Math.max(0, playPos / fileduration))
    : 0;

  // Hover/tap reveal: web -> hover; native -> first tap shows controls
  const [overlayVisible, setOverlayVisible] = useState(false);
  const showOverlay = (visible: boolean) => setOverlayVisible(visible);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      if (!overlayVisible) {
        setOverlayVisible(true);
        return; // don't navigate on first tap
      }
    }
    router.push(`/details/${item.id}`);
  };

  const handlePlay = (e?: any) => {
    // prevent accidental parent navigation on web
    e?.stopPropagation?.();
    router.push(`/player/${item.id}`);
  };

  return (
    <Tile
      accessibilityRole="button"
      onPress={handlePress}
      onHoverIn={Platform.OS === 'web' ? () => showOverlay(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => showOverlay(false) : undefined}
      width={width}
      height={height}
    >
      {/* Poster */}
      {hasThumb ? (
        <Poster
          source={{ uri: item.thumbnailUrl }}
          zoomed={overlayVisible}
        />
      ) : (
        <PosterPlaceholder>
          {/* Branded placeholder logo */}
          { }
          <LogoImage source={require('@/assets/images/rms-logo-192.png')} resizeMode="contain" />
        </PosterPlaceholder>
      )}

      {/* Detail bar (slides up on hover) */}
      <DetailOverlay
        experimentalBlurMethod="dimezisBlurView" intensity={50} tint="dark"
        pointerEvents="none"
        visible={overlayVisible}
      >
        <Title numberOfLines={1} adjustsFontSizeToFit onPress={handlePress}>
          {item.title}
        </Title>
        <DetailRow>
          <TitleWrap>
            {typeof item.year === 'number' || typeof item.year === 'string' ? (
              <Year>{String(item.year)}</Year>
            ) : null}
          </TitleWrap>
          {seasonEpisode ? (
            <SeasonEpisode>{seasonEpisode}</SeasonEpisode>
          ) : <Spacer />}
        </DetailRow>
      </DetailOverlay>

      {/* Floating play button (appears on hover) */}
      <PlayButton
        onHoverIn={Platform.OS === 'web' ? () => showOverlay(true) : undefined}
        accessibilityLabel="Play"
        testID="play-button"
        visible={overlayVisible}
        onPress={handlePlay}
      >
        <MaterialIcons name={'play-arrow'} color={'white'} />
      </PlayButton>

      {progress > 0 &&
        <ProgressBarWrap>
          <SharedProgressBar testID="progress-bar" progress={progress} height={3} fillColor="#d9c31f" backgroundColor="transparent" />
        </ProgressBarWrap>
      }

    </Tile>
  );
}

const Tile = styled.Pressable<{ width: number; height: number }>`
  border-radius: 6px;
  overflow: hidden;
  background-color: #1c1d36;
  position: relative;
  width: ${({ width }: { width: number }) => `${width}px`};
  height: ${({ height }: { height: number }) => `${height}px`};
`;

const Poster = styled.Image<{ zoomed?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: #333;
  ${({ zoomed }: { zoomed?: boolean }) => zoomed && `transform: scale(1.1);`}
  transition: transform 0.2s ease-out;
`;

const PosterPlaceholder = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  background-color: #111318;
`;

const ProgressBarWrap = styled.View<{ hover?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background-color: ${({ hover }: { hover?: boolean }) => (hover ? 'transparent' : 'black')};
  padding-vertical: 1px;
`;

const DetailOverlay = styled(BlurView)<{ visible?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: rgba(10,12,26,0.8);
  bottom: ${({ visible }: { visible?: boolean }) => (visible ? '0px' : '-80px')};
  transition: bottom 0.2s ease-out;
`;

const DetailRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const TitleWrap = styled.View`
  flex-direction: row;
  align-items: center;
  max-width: 180px;
  flex-shrink: 1;
`;

const Title = styled(ThemedText)`
  color: white;
`;

const Year = styled(ThemedText)`
  color: white;
  opacity: 0.85;
`;

const SeasonEpisode = styled(ThemedText)`
  color: white;
  opacity: 0.85;
`;

const Spacer = styled.View``;

const PlayButton = styled(SecondaryButton)<{ visible?: boolean }>`
  position: absolute;
  right: 10px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  bottom: ${({ visible }: { visible?: boolean }) => (visible ? '45px' : '-40px')};
  transition: bottom 0.3s cubic-bezier(0.66, 0, 0.34, 1);
`;

const LogoImage = styled.Image`
  width: 60%;
  height: 60%;
  opacity: 0.9;
`;
