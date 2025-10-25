import React, { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { store } from '@/src/services/store';

function AllProviders({ children }: PropsWithChildren<{}>) {
  // Keep light theme for predictable snapshots/behavior in tests
  return (
    <Provider store={store}>
      <ThemeProvider value={DefaultTheme}>{children}</ThemeProvider>
    </Provider>
  );
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: AllProviders });
}
