import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGetItemsQuery } from '@/src/services/api/media';

export default function LibraryScreen() {
  const { data: items, isLoading, isError } = useGetItemsQuery();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E6F0F2', dark: '#1E2A2E' }}
      headerImage={<ThemedView />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Library</ThemedText>
      </ThemedView>
      {isLoading && <ThemedText>Loading…</ThemedText>}
      {isError && <ThemedText>Failed to load items.</ThemedText>}
      {!isLoading && !isError && (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.placeholder]} />
              )}
              <ThemedText>{item.title}</ThemedText>
            </View>
          )}
          ListEmptyComponent={<ThemedText>No items found.</ThemedText>}
        />
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  placeholder: {
    opacity: 0.5,
  },
});
