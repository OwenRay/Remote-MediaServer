import React, { PropsWithChildren } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/src/features/shared/model/store';
import { ThemeProvider as StyledThemeProvider, DefaultTheme as SCDefaultTheme } from 'styled-components/native';

import mock from 'react-native-safe-area-context/jest/mock';

// Mock react-native-google-cast to avoid native module calls in tests
jest.mock('react-native-google-cast', () => {
  const CastState = { CONNECTED: 'CONNECTED', NOT_CONNECTED: 'NOT_CONNECTED' } as const;
  return {
    __esModule: true,
    default: { CastState, CastContext: { showCastDialog: async () => false, getSessionManager: () => ({ endCurrentSession: async () => {} }) } },
    CastContext: { showCastDialog: async () => false, getSessionManager: () => ({ endCurrentSession: async () => {} }) },
    useDevices: () => [],
    useCastState: () => CastState.NOT_CONNECTED,
    useRemoteMediaClient: () => undefined,
    CastButton: () => null,
    CastState,
  };
});

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
