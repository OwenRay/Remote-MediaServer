import { useMemo } from 'react';
import { useGetSettingsQuery } from '@/src/features/settings/model/settings';

export type LibraryOption = {
  id?: string;
  name: string;
};

function computeLibraryId(uuid?: string, type?: string): string | undefined {
  if (!uuid) return undefined;
  if (type === 'shared') {
    // Legacy behavior: shared libraries use a compound uuid, server expects the first segment
    const [first] = uuid.split('-');
    return first || uuid;
  }
  return uuid;
}

export function useLibraries(): { libraries: LibraryOption[]; isLoading: boolean } {
  const { data: settings, isFetching } = useGetSettingsQuery();

  const libraries = useMemo<LibraryOption[]>(() => {
    const list = settings?.libraries ?? [];
    return list.map((lib) => ({
      id: computeLibraryId(lib.uuid, lib.type),
      name: lib.name ?? 'Unnamed',
    }));
  }, [settings?.libraries]);

  return { libraries, isLoading: isFetching };
}
