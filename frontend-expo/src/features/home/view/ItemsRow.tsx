import React from 'react';
import { FlatList, View } from 'react-native';
import { default as styled } from 'styled-components/native';

import { Card, CardTitle } from '@/src/features/shared/view/Card';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { MediaItemTile } from '@/src/features/library/view/MediaItemTile';
import type { MediaItem } from '@/src/features/library/model/media';
import { useGetHomeQuery, type HomeRowKey } from '@/src/features/home/model/home';

export type ItemsRowProps = {
  title: string;
  row: HomeRowKey;
};

export function ItemsRow({ title, row }: ItemsRowProps) {
  const { data, isFetching, isUninitialized, isError } = useGetHomeQuery();

  const items: MediaItem[] = data?.[row] ?? [];

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {isFetching || isUninitialized ? (
        <RowPlaceholder>
          <ThemedText>Loading...</ThemedText>
        </RowPlaceholder>
      ) : items.length === 0 || isError ? (
        <RowPlaceholder>
          <ThemedText>Nothing to see here yet</ThemedText>
        </RowPlaceholder>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <MediaItemTile item={item} />
          )}
          removeClippedSubviews={false}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </Card>
  );
}

// Locally-scoped styled components specific to ItemsRow layout
const RowPlaceholder = styled(View)`
  padding-vertical: 16px;
`;
