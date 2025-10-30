import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils';
import { Platform } from 'react-native';
import { VideoSurface } from './VideoSurface';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';

function makeController(overrides: Partial<PlayerController> = {}): PlayerController {
  // minimal mock fulfilling the type shape used by VideoSurface
  // @ts-expect-error partial for tests
  return {
    player: { currentTime: 0 },
    paused: false,
    setPaused: jest.fn(),
    position: 0,
    onSeek: jest.fn(),
    currentTime: 0,
    volume: 1,
    setVolume: jest.fn(),
    togglePlay: jest.fn(),
    error: undefined,
    retry: jest.fn(),
    toggleFullscreen: jest.fn(),
    ...overrides,
  } as unknown as PlayerController;
}

describe('VideoSurface', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    // restore after each
     
    (Platform as any).OS = originalOS;
    jest.clearAllMocks();
  });

  it('calls onTogglePlay when pressed on web', () => {
     
    (Platform as any).OS = 'web';
    const controller = makeController();
    const onTogglePlay = jest.fn();
    const { getByTestId } = renderWithProviders(<VideoSurface controller={controller} onTogglePlay={onTogglePlay} />);
    fireEvent.press(getByTestId('video-surface'));
    expect(onTogglePlay).toHaveBeenCalled();
  });

  it('does not call onTogglePlay when pressed on native (ios)', () => {
     
    (Platform as any).OS = 'ios';
    const controller = makeController();
    const onTogglePlay = jest.fn();
    const { getByTestId } = renderWithProviders(<VideoSurface controller={controller} onTogglePlay={onTogglePlay} />);
    fireEvent.press(getByTestId('video-surface'));
    expect(onTogglePlay).not.toHaveBeenCalled();
  });

  it('shows retry overlay when error exists', () => {
    const retry = jest.fn();
    const controller = makeController({ error: 'x', retry });
    const { getByText } = renderWithProviders(<VideoSurface controller={controller} onTogglePlay={jest.fn()} />);
    fireEvent.press(getByText('Retry'));
    expect(retry).toHaveBeenCalled();
  });
});
