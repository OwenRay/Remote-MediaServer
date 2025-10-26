import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetItemQuery } from '@/src/services/api/media';
import { ThemedText } from '@/src/components/themed-text';
import { useTheme } from '@react-navigation/native';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading, isError } = useGetItemQuery(String(id));
  const router = useRouter();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.center}>
        <ThemedText>Failed to load item.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>{item.title}</ThemedText>
      <ThemedText style={styles.meta}>Duration: {Math.round((item.fileduration ?? 0) / 60)} min</ThemedText>
      <View style={styles.actions}>
        <Pressable accessibilityLabel="Play" style={styles.playBtn} onPress={() => router.push(`/player/${item.id}`)}>
          <ThemedText style={styles.playText}>Play</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
  },
  meta: {
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  playBtn: {
    backgroundColor: '#00b894',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playText: {
    color: 'white',
    fontWeight: '700',
  }
});
