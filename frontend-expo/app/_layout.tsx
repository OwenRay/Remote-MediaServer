import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Provider } from 'react-redux';
import { store } from '@/src/features/shared/model/store';
import { NavigationDarkTheme } from '@/src/theme';
import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components/native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <NavigationThemeProvider value={NavigationDarkTheme}>
        <StyledThemeProvider theme={{
          colors: {
            primary: NavigationDarkTheme.colors.primary,
            text: NavigationDarkTheme.colors.text,
            background: NavigationDarkTheme.colors.background,
            tint: NavigationDarkTheme.colors.primary,
            icon: '#9BA1A6',
            tabIconDefault: '#9BA1A6',
            tabIconSelected: NavigationDarkTheme.colors.primary,
            border: NavigationDarkTheme.colors.border,
            card: NavigationDarkTheme.colors.card,
          },
        } as DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </StyledThemeProvider>
      </NavigationThemeProvider>
    </Provider>
  );
}
