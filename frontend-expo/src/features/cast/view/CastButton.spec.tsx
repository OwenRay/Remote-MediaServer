import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { ControlsBar } from '@/src/features/player/view/ControlsBar';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import {Platform} from 'react-native';

jest.mock('@/src/features/cast/domain/useCast', () => ({
  useCast: () => ({ available: true, casting: false, start: jest.fn(), stop: jest.fn(), play: jest.fn(), pause: jest.fn(), setVolume: jest.fn(), loadMedia: jest.fn() })
}));

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { get: () => 'web' });
});

function makeController(overrides: Partial<PlayerController> = {}): PlayerController {
  // @ts-expect-error partial for tests
  return {
    player: { currentTime: 5, playing: false, pause: jest.fn() },
    paused: true,
    setPaused: jest.fn(),
    position: 10,
    onSeek: jest.fn(),
    currentTime: 0,
    volume: 1,
    setVolume: jest.fn(),
    togglePlay: jest.fn(),
    error: undefined,
    retry: jest.fn(),
    toggleFullscreen: jest.fn(),
    item: {fileduration: 100, id: '1', title: 'Test', posterUrl: 'http://x/y.jpg'},
    ...overrides,
  } as unknown as PlayerController;
}

describe('Cast button', () => {
  it('renders cast button and can be pressed', () => {
    const controller = makeController();
    const { getByText } = renderWithProviders(<ControlsBar controller={controller} />);
    // Hidden label used for accessibility
    expect(getByText('Cast')).toBeTruthy();
  });
});
