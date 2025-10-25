import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/src/services/api/base';

// Placeholder UI slice could be added later (theme, playback UI, etc.)

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
