import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PlayerState = {
  paused: boolean;
  buffering: boolean;
  duration: number; // seconds
  position: number; // seconds
  volume: number; // 0..1
  error?: string;
};

const initialState: PlayerState = {
  paused: true,
  buffering: false,
  duration: 0,
  position: 0,
  volume: 1,
};

const slice = createSlice({
  name: 'playerUi',
  initialState,
  reducers: {
    togglePause(state) {
      state.paused = !state.paused;
    },
    setPaused(state, action: PayloadAction<boolean>) {
      state.paused = action.payload;
    },
    setBuffering(state, action: PayloadAction<boolean>) {
      state.buffering = action.payload;
    },
    setDuration(state, action: PayloadAction<number>) {
      state.duration = action.payload;
    },
    setPosition(state, action: PayloadAction<number>) {
      state.position = Math.max(0, action.payload);
    },
    seekBy(state, action: PayloadAction<number>) {
      state.position = Math.max(0, state.position + action.payload);
    },
    setVolume(state, action: PayloadAction<number>) {
      const v = action.payload;
      state.volume = Math.max(0, Math.min(1, v));
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
    },
    reset: () => initialState,
  },
});

export const playerUiReducer = slice.reducer;
export const playerUiActions = slice.actions;
