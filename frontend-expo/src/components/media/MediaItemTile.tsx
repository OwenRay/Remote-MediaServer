import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import type { MediaItem } from '@/src/services/api/media';
import {BlurView} from "expo-blur";
import {Ionicons} from "@expo/vector-icons";

export type MediaItemTileProps = {
  item: MediaItem & Partial<{ playPos: number }>;
  onPress?: () => void; // navigate to detail/player
  onPlay?: () => void; // explicit play action (overlay button)
  width?: number; // cell width (default 150)
  height?: number; // cell height (default 218)
  style?: any;
  testID?: string;
};

export function MediaItemTile({ item, onPress = () => {}, onPlay = () => {}, width = 150, height = 218, style, testID }: MediaItemTileProps) {
  const hasThumb = !!item.thumbnailUrl;
  const season = typeof item.season === 'number' ? item.season : undefined;
  const episode = typeof item.episode === 'number' ? item.episode : undefined;
  const seasonEpisode = season !== undefined && episode !== undefined
    ? `s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`
    : undefined;

  const fileduration = item.fileduration ?? 0;
  const playPos = (item as any).playPos as number | undefined;
  const progress = fileduration > 0 && typeof playPos === 'number' && playPos >= 0
    ? Math.min(1, Math.max(0, playPos / fileduration))
    : 0;

  // Hover/tap reveal: web -> hover; native -> first tap shows controls
  const [overlayVisible, setOverlayVisible] = useState(false);
  const showOverlay = (visible: boolean) => setOverlayVisible(visible);

  const containerStyle = useMemo(() => [
    styles.tile,
    { width, height },
    style,
  ], [width, height, style]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      if (!overlayVisible) {
        setOverlayVisible(true);
        return; // don't navigate on first tap
      }
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      onHoverIn={Platform.OS === 'web' ? () => showOverlay(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => showOverlay(false) : undefined}
      style={containerStyle}
      testID={testID ?? 'media-item-tile'}
    >
      {/* Poster */}
      {hasThumb ? (
        <Image source={{ uri: item.thumbnailUrl }} style={[
          styles.poster,
          overlayVisible ? styles.posterZoomed : undefined,
        ]} />
      ) : (
        <View style={[styles.poster, styles.placeholder]} />
      )}

      {/* Progress bar (top) */}
      {progress > 0 ? (
        <View style={[styles.progressBar, overlayVisible ? styles.progressBarHover : undefined]} testID="progress-bar">
          <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}

      {/* Detail bar (slides up on hover) */}
      <BlurView
        pointerEvents="none"
        style={[styles.detail, overlayVisible ? styles.detailVisible : styles.detailHidden]}
      >
        <ThemedText adjustsFontSizeToFit={true} numberOfLines={1} style={styles.title}>{item.title}</ThemedText>
        <View style={styles.detailRow}>
          <View style={styles.titleWrap}>
            {typeof item.year === 'number' || typeof item.year === 'string' ? (
              <ThemedText style={styles.year}>{String(item.year)}</ThemedText>
            ) : null}
          </View>
          {seasonEpisode ? (
            <ThemedText style={styles.seasonEpisode}>{seasonEpisode}</ThemedText>
          ) : <View />}
        </View>


        {/* Floating play button (appears on hover) */}
      </BlurView>
      <Pressable
        onHoverIn={Platform.OS === 'web' ? () => showOverlay(true) : undefined}
        accessibilityLabel="Play"
        testID="play-button"
        style={[styles.playButton, overlayVisible ? styles.playButtonVisible : styles.playButtonHidden]}
        onPress={(e) => {
          console.log("play button pressed");
          // prevent accidental parent navigation on web
          e?.stopPropagation();
          onPlay();
        }}
      >
        <Ionicons color={'white'} name={'play'}/>
      </Pressable>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: '#1c1d36', // $primary-color
    position: 'relative',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
  },
  posterZoomed: {
    transform: [{ scale: 1.1 }], // matches .poster background-size: 110%
  },
  placeholder: {
    opacity: 0.5,
  },
  // Progress at top similar to .percent-played
  progressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -5,
    height: 5,
    backgroundColor: 'black',
    paddingVertical: 1,
  },
  progressBarHover: {
    top: -3,
    backgroundColor: 'transparent',
    paddingVertical: 1,
  },
  progress: {
    height: 3,
    backgroundColor: '#d9c31f',
  },
  // Floating play button like .grid-item .btn-floating
  playButton: {
    position: 'absolute',
    right: 10,
    width: 36,
    height: 36,
    lineHeight:36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: 'rgb(217,195,31)',
    transitionProperty: 'bottom',
    transitionDuration: '0.4s',

  },
  playButtonHidden: {
    bottom: -80,
  },
  playButtonVisible: {
    bottom: 60,
  },
  playIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Bottom detail bar
  detail: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(10,12,26,0.8)',
    transitionProperty: 'bottom',
    transitionDuration: '0.2s',
  },
  detailHidden: {
    bottom: -80,
  },
  detailVisible: {
    bottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 130 + 10 + 40, // title width + gap + year approx
    flexShrink: 1,
  },
  title: {
    color: 'white',
  },
  year: {
    color: 'white',
    opacity: 0.85,
  },
  seasonEpisode: {
    color: 'white',
    opacity: 0.85,
  },
});

export default MediaItemTile;
