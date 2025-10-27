import { useMemo } from 'react';

/**
 * Calculates number of columns for a grid based on the available window width.
 * This hook is UI-agnostic and can be reused by any grid layout.
 */
export function useGridColumns(
  windowWidth: number,
  options: { cellWidth: number; gutter: number; horizontalPadding: number }
): number {
  const { cellWidth, gutter, horizontalPadding } = options;

  return useMemo(() => {
    const innerWidth = Math.max(0, windowWidth - horizontalPadding * 2);
    const cols = Math.max(1, Math.floor((innerWidth + gutter) / (cellWidth + gutter)));
    return cols;
  }, [windowWidth, cellWidth, gutter, horizontalPadding]);
}

