import React from 'react';
import { View, StyleSheet } from 'react-native';

export type MediaItemTilePlaceholderProps = {
  width?: number;
  height?: number;
};

export default function MediaItemTilePlaceholder({ width = 236, height = 150 }: MediaItemTilePlaceholderProps) {
  return (
    <View
      testID="media-item-placeholder"
      style={[styles.tile, { width, height }]}
      accessibilityLabel="Loading media item"
      accessibilityRole="image"
    >
      <View style={styles.poster} />
      <View style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
    position: 'relative',
  },
  poster: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2a2a2a',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: '#333',
  },
});
