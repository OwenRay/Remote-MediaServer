import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils';
import MediaItemTile from '@/src/components/media/MediaItemTile';
import type { MediaItem } from '@/src/services/api/media';

function makeItem(overrides: Partial<MediaItem & { playPos?: number }> = {}): MediaItem & { playPos?: number } {
  return {
    id: 'abc123',
    title: 'Playable Movie',
    fileduration: 200,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    ...overrides,
  } as any;
}

describe('MediaItemTile play overlay', () => {
  it('renders play button and calls onPlay', () => {
    const item = makeItem();
    const onPlay = jest.fn();
    const {getByLabelText} = renderWithProviders(<MediaItemTile item={item} onPlay={onPlay} />);
    const play = getByLabelText('Play');
    fireEvent.press(play);
    expect(onPlay).toHaveBeenCalled();
  });
});
