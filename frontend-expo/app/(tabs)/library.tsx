import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {default as styled} from 'styled-components/native';

import SearchBar, {FiltersState} from '@/src/components/search/SearchBar';
import {MediaItemTile} from '@/src/components/media/MediaItemTile';
import MediaItemTilePlaceholder from '@/src/components/media/MediaItemTilePlaceholder';
import { ThemedText } from '@/src/components/themed-text';
import { useLazyGetItemsPagedQuery } from '@/src/features/library/model/media';

const ColumnWrapper = { gap: 15, justifyContent: 'center' } as const;

const CELL_WIDTH = 150;
const CELL_HEIGHT = 236;
const GUTTER = 15;
const H_PADDING = 16; // matches container paddingHorizontal
const PAGE_SIZE = 48;

export default function LibraryScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();

  const [trigger, { isFetching, isError } ] = useLazyGetItemsPagedQuery();
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const loadingPagesRef = useRef(new Set<string>());

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FiltersState>({ sort: 'date_added:DESC' });

  // compute columns based on width
  const cols = useMemo(() => {
    const innerWidth = Math.max(0, windowWidth - H_PADDING * 2);
    const c = Math.max(1, Math.floor((innerWidth + GUTTER) / (CELL_WIDTH + GUTTER)));
    return c;
  }, [windowWidth]);

  const ensurePageLoaded = (index: number) => {
    const pageStart = Math.floor(index / PAGE_SIZE) * PAGE_SIZE;
    const key = `${pageStart}-${query}-${filters.libraryId ?? ''}-${filters.sort ?? ''}`;
    if (loadingPagesRef.current.has(key)) return;
    loadingPagesRef.current.add(key);
    trigger({ offset: pageStart, limit: PAGE_SIZE, title: query || undefined, libraryId: filters.libraryId, sort: filters.sort })
      .unwrap()
      .then((res) => {
        if(!res) throw new Error("No response");
        return res;
      })
      .then(({ items: pageItems, total }) => {
        setTotalCount((prev) => (prev === 0 ? total : prev));
        setItems((prev) => {
          const next = prev.length === 0 && total ? new Array(total).fill(undefined) : [...prev];
          if (total && next.length < total) {
            next.length = total;
          }
          pageItems.forEach((it, i) => {
            next[pageStart + i] = it;
          });
          return next;
        });
      })
      .catch(console.error)
      .finally(() => {
        loadingPagesRef.current.delete(key);
      });
  };

  // Reset results on query/filter change and load first page
  useEffect(() => {
    setItems([]);
    setTotalCount(0);
    loadingPagesRef.current.clear();
    ensurePageLoaded(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.libraryId, filters.sort]);

  const data = useMemo(() => {
    const count = totalCount || items.length || 0;
    return Array.from({ length: count }, (_, i) => i);
  }, [totalCount, items.length]);

  const renderItem = ({ item: index }: ListRenderItemInfo<number>) => {
    const itm = items[index];
    if (!itm) {
      ensurePageLoaded(index);
      return (
        <Cell>
          <CellInner>
            <MediaItemTilePlaceholder width={CELL_WIDTH} height={CELL_HEIGHT} />
          </CellInner>
        </Cell>
      );
    }
    return (
      <Cell>
        <CellInner>
          <MediaItemTile
            width={CELL_WIDTH}
            height={CELL_HEIGHT}
            item={itm}
            onPress={() => router.push(`/details/${itm.id}`)}
            onPlay={() => router.push(`/player/${itm.id}`)}
          />
        </CellInner>
      </Cell>
    );
  };

  return (
    <Container>
      <SearchBar filters={filters} onFiltersChange={setFilters} value={query} onChange={setQuery} />
      {isError && <ThemedText>Failed to load items.</ThemedText>}
        <FlatList
          testID="search-list"
          key={cols}
          data={data}
          numColumns={cols}
          centerContent
          keyExtractor={(index) => `row-${index}`}
          renderItem={renderItem}
          indicatorStyle={theme.dark ? 'white' : 'black'}
          columnWrapperStyle={ColumnWrapper}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            const nextIndex = Math.max(0, data.length - 1);
            ensurePageLoaded(nextIndex + 1);
          }}
          ListFooterComponent={<FooterSpace />}
          ListEmptyComponent={
            isFetching ? (
              <Center>
                <ActivityIndicator size="large" color={theme.colors.text} />
              </Center>
            ) : (
              <NoItemsText>No items found.</NoItemsText>
            )
          }
        />
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
`;


const Cell = styled.View`
  width: ${CELL_WIDTH}px;
`;

const CellInner = styled.View`
  height: ${CELL_HEIGHT}px;
  margin-bottom: ${GUTTER}px;
`;

const NoItemsText = styled(ThemedText)`
  padding: 16px;
`;

const FooterSpace = styled.View`
  height: 24px;
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;
