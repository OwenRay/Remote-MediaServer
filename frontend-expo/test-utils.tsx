import React, { PropsWithChildren } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/src/services/store';
import { ThemeProvider as StyledThemeProvider, DefaultTheme as SCDefaultTheme } from 'styled-components/native';

import mock from 'react-native-safe-area-context/jest/mock';

const styledTheme: SCDefaultTheme = {
  colors: {
    primary: '#1c1d36',
    text: '#000000',
    background: '#ffffff',
    tint: DefaultTheme.colors.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: DefaultTheme.colors.primary,
    border: '#cccccc',
  },
};

function AllProviders({ children }: PropsWithChildren<{}>) {
  // Keep light navigation theme for predictable behavior in tests
  return (
    <Provider store={store}>
      <ThemeProvider value={DefaultTheme}>
        <StyledThemeProvider theme={styledTheme}>
          <mock.SafeAreaProvider>
            {children}
          </mock.SafeAreaProvider>
        </StyledThemeProvider>
      </ThemeProvider>
    </Provider>
  );
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(<AllProviders>{ui}</AllProviders>);
}
