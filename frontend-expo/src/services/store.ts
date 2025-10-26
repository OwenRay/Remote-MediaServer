import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/src/services/api/base';
import { playerUiReducer } from '@/src/features/player/controlsSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    playerUi: playerUiReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
