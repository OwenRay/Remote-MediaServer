import { playerUiReducer, playerUiActions, PlayerState } from '@/src/features/player/controlsSlice';

function reduce(state: PlayerState | undefined, action: any) {
  return playerUiReducer(state as any, action);
}

describe('playerUi controls slice', () => {
  it('toggles pause state', () => {
    let s = reduce(undefined, { type: '@@INIT' });
    expect(s.paused).toBe(true);
    s = reduce(s, playerUiActions.togglePause());
    expect(s.paused).toBe(false);
    s = reduce(s, playerUiActions.togglePause());
    expect(s.paused).toBe(true);
  });

  it('sets and bounds volume between 0 and 1', () => {
    let s = reduce(undefined, { type: '@@INIT' });
    s = reduce(s, playerUiActions.setVolume(1.5));
    expect(s.volume).toBe(1);
    s = reduce(s, playerUiActions.setVolume(-0.3));
    expect(s.volume).toBe(0);
    s = reduce(s, playerUiActions.setVolume(0.7));
    expect(s.volume).toBe(0.7);
  });

  it('seeks by delta and prevents negative position', () => {
    let s = reduce(undefined, { type: '@@INIT' });
    s = reduce(s, playerUiActions.setPosition(10));
    expect(s.position).toBe(10);
    s = reduce(s, playerUiActions.seekBy(-5));
    expect(s.position).toBe(5);
    s = reduce(s, playerUiActions.seekBy(-10));
    expect(s.position).toBe(0);
  });

  it('sets buffering and error states', () => {
    let s = reduce(undefined, { type: '@@INIT' });
    s = reduce(s, playerUiActions.setBuffering(true));
    expect(s.buffering).toBe(true);
    s = reduce(s, playerUiActions.setError('oops'));
    expect(s.error).toBe('oops');
    s = reduce(s, playerUiActions.setError(undefined));
    expect(s.error).toBeUndefined();
  });
});
