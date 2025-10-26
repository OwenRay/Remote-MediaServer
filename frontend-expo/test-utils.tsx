import React, { PropsWithChildren } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/src/services/store';

import mock from 'react-native-safe-area-context/jest/mock';



function AllProviders({ children }: PropsWithChildren<{}>) {
  // Keep light theme for predictable behavior in tests
  return (
    <Provider store={store}>

      <ThemeProvider value={DefaultTheme}>
      <mock.SafeAreaProvider>
        {children}
      </mock.SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(<AllProviders>{ui}</AllProviders>);
}
