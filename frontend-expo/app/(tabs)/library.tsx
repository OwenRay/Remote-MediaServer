import React from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import {default as styled} from 'styled-components/native';

import {SearchBar} from '@/src/features/library/view/SearchBar';
import {MediaItemTile} from '@/src/features/library/view/MediaItemTile';
import { MediaItemTilePlaceholder} from '@/src/features/library/view/MediaItemTilePlaceholder';
import { useScrollbarWidth } from '@/src/features/shared/model/useScrollbarWidth';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { useGridColumns } from '@/src/features/library/view/useGridColumns';
import { usePagedMedia } from '@/src/features/library/model/usePagedMedia';

const BASE_CELL_WIDTH = 150; // used only for determining column count
const BASE_CELL_HEIGHT = 236; // used for aspect ratio
const GUTTER = 15;
const H_PADDING = 16; // matches contentContainerStyle paddingHorizontal
const PAGE_SIZE = 48;

const ColumnWrapper = { gap: GUTTER } as const;

export default function LibraryScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const scrollbarWidth = useScrollbarWidth();
  const layoutWidth = Math.max(0, windowWidth - scrollbarWidth);

  const { query, setQuery, filters, setFilters, dataIndices, items, isFetching, isError, ensurePageLoaded } = usePagedMedia({ pageSize: PAGE_SIZE });

  // compute columns based on window width (logic unchanged)
  const cols = useGridColumns(layoutWidth, { cellWidth: BASE_CELL_WIDTH, gutter: GUTTER, horizontalPadding: H_PADDING });

  // compute dynamic cell size so the row fills the width exactly
  const innerWidth = Math.max(0, layoutWidth - H_PADDING * 2);
  const cellWidth = React.useMemo(() => {
    const totalGutters = GUTTER * Math.max(0, cols - 1);
    const available = Math.max(0, innerWidth - totalGutters);
    return Math.floor(available / Math.max(1, cols));
  }, [innerWidth, cols]);
  const aspect = BASE_CELL_HEIGHT / BASE_CELL_WIDTH;
  const cellHeight = Math.round(cellWidth * aspect);

  const PlaceholderCell: React.FC<{ index: number }> = ({ index }) => {
    React.useEffect(() => {
      ensurePageLoaded(index);
    }, [index]);
    return (
      <Cell width={cellWidth}>
        <CellInner height={cellHeight}>
          <MediaItemTilePlaceholder width={cellWidth} height={cellHeight} />
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
      <Cell width={cellWidth}>
        <CellInner height={cellHeight}>
          <MediaItemTile
            width={cellWidth}
            height={cellHeight}
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
          removeClippedSubviews={false}
          keyExtractor={(index) => `row-${index}`}
          renderItem={renderItem}
          indicatorStyle={theme.dark ? 'white' : 'black'}
          columnWrapperStyle={ColumnWrapper}
          contentContainerStyle={{ paddingHorizontal: H_PADDING }}
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


const Cell = styled.View<{width: number}>`
  width: ${(p: { width: number }) => p.width}px;
`;

const CellInner = styled.View<{height: number}>`
  height: ${(p: { height: number }) => p.height}px;
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
