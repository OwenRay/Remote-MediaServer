import {useEffect, useMemo, useRef, useState} from 'react';
import {FiltersState} from '@/src/features/library/view/SearchBar';
import {useLazyGetItemsPagedQuery} from '@/src/features/library/model/media';

export type UsePagedMediaParams = {
  pageSize?: number;
};

export type UsePagedMediaState = {
  query: string;
  setQuery: (q: string) => void;
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  dataIndices: number[];
  items: any[];
  totalCount: number;
  isFetching: boolean;
  isError: boolean;
  ensurePageLoaded: (index: number) => void;
};

/**
 * Encapsulates pagination, caching and loading of media items list.
 * Responsible for talking to the media API and exposing state for the view.
 */
export function usePagedMedia({ pageSize = 48 }: UsePagedMediaParams = {}): UsePagedMediaState {
  const [trigger, { isFetching, isError }] = useLazyGetItemsPagedQuery();
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const loadingPagesRef = useRef(new Set<string>());

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FiltersState>({ sort: 'date_added:DESC', distinct: 'external-id' });

  const ensurePageLoaded = (index: number) => {
    const pageStart = Math.floor(index / pageSize) * pageSize;
    const key = `${pageStart}-${query}-${filters.libraryId ?? ''}-${filters.sort ?? ''}-${filters.distinct ?? ''}`;
    if (loadingPagesRef.current.has(key)) return;
    loadingPagesRef.current.add(key);
    trigger({
      offset: pageStart,
      limit: pageSize,
      title: query || undefined,
      libraryId: filters.libraryId,
      sort: filters.sort,
      distinct: filters.distinct,
    })
      .unwrap()
      .then((res) => {
        if(!res) throw new Error('No response');
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
      // .catch(console.error)
      // .finally(() => {
      //   loadingPagesRef.current.delete(key);
      // });
  };

  // Reset results on query/filter change and load first page
  useEffect(() => {
    setItems([]);
    setTotalCount(0);
    loadingPagesRef.current.clear();
    ensurePageLoaded(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.libraryId, filters.sort, filters.distinct]);

  const dataIndices = useMemo(() => {
    const count = totalCount || items.length || 0;
    return Array.from({ length: count }, (_, i) => i);
  }, [totalCount, items.length]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    dataIndices,
    items,
    totalCount,
    isFetching,
    isError,
    ensurePageLoaded,
  };
}

