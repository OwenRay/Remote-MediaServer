import React from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import {default as styled} from 'styled-components/native';

import {SearchBar} from '@/src/features/library/view/SearchBar';
import {MediaItemTile} from '@/src/features/library/view/MediaItemTile';
import { MediaItemTilePlaceholder} from '@/src/features/library/view/MediaItemTilePlaceholder';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { useGridColumns } from '@/src/features/library/view/useGridColumns';
import { usePagedMedia } from '@/src/features/library/model/usePagedMedia';

const ColumnWrapper = { gap: 15, justifyContent: 'center' } as const;

const CELL_WIDTH = 150;
const CELL_HEIGHT = 236;
const GUTTER = 15;
const H_PADDING = 16; // matches container paddingHorizontal
const PAGE_SIZE = 48;

export default function LibraryScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const { query, setQuery, filters, setFilters, dataIndices, items, isFetching, isError, ensurePageLoaded } = usePagedMedia({ pageSize: PAGE_SIZE });

  // compute columns based on width
  const cols = useGridColumns(windowWidth, { cellWidth: CELL_WIDTH, gutter: GUTTER, horizontalPadding: H_PADDING });

  const PlaceholderCell: React.FC<{ index: number }> = ({ index }) => {
    React.useEffect(() => {
      ensurePageLoaded(index);

    }, [index]);
    return (
      <Cell>
        <CellInner>
          <MediaItemTilePlaceholder width={CELL_WIDTH} height={CELL_HEIGHT} />
        </CellInner>
      </Cell>
    );
  };

  const renderItem = ({ item: index }: ListRenderItemInfo<number>) => {
    const itm = items[index];
    if (!itm) {
      return <PlaceholderCell index={index} />;
    }
    return (
      <Cell>
        <CellInner>
          <MediaItemTile
            width={CELL_WIDTH}
            height={CELL_HEIGHT}
            item={itm}
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
          data={dataIndices}
          numColumns={cols}
          centerContent
          removeClippedSubviews={false}
          keyExtractor={(index) => `row-${index}`}
          renderItem={renderItem}
          indicatorStyle={theme.dark ? 'white' : 'black'}
          columnWrapperStyle={ColumnWrapper}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            const nextIndex = Math.max(0, dataIndices.length - 1);
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
  margin-top: ${GUTTER}px;
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
