import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils';
import { ControlsBar } from './ControlsBar';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import {Platform} from "react-native";

function makeController(overrides: Partial<PlayerController> = {}): PlayerController {
  // @ts-expect-error partial for tests
  return {
    player: { currentTime: 5, playing: false },
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
    item: {fileduration: 100},
    ...overrides,
  } as unknown as PlayerController;
}

describe('ControlsBar', () => {
  it('invokes togglePlay when play button pressed', () => {
    const controller = makeController();
    // const {getByLabelText} = render();
    const { getByRole } = renderWithProviders(<ControlsBar controller={controller} />);
    fireEvent.press(getByRole('button', { name: 'play' }));

    expect(controller.togglePlay).toHaveBeenCalled();
  });

  it('renders without crashing and exposes seek bar', () => {
    const onSeek = jest.fn();
    const controller = makeController({ onSeek });
    const { getByText } = renderWithProviders(<ControlsBar controller={controller} />);
    // presence of time labels indicates the row with seek bar rendered
    expect(getByText('00:10')).toBeTruthy();
    expect(getByText('01:40')).toBeTruthy();
  });

  it('toggles mute button text based on volume', () => {
    Platform.OS = 'web';
    const controller = makeController({ volume: 0 });
    const { getByText } = renderWithProviders(<ControlsBar controller={controller} />);
    fireEvent.press(getByText('Unmute'));
    expect(controller.setVolume).toHaveBeenCalled();
  });
});
