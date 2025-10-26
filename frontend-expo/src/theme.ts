/**
 * App theme constants.
 * Primary palette derived from legacy SCSS:
 * - primary: #1c1d36
 * - primaryLight: #534c67
 * - primaryDark: #0a0c1a
 * - secondary (accent): #b8a300
 */

import { Platform } from 'react-native';
import {DarkTheme, Theme as NavigationTheme} from '@react-navigation/native';

const secondary = '#b8a300';

export const Colors = {
  light: {
    // Light theme values are defined for completeness; app uses dark by default
    primary: '#d1d2fb',
    text: '#11181C',
    background: '#ffffff',
    tint: secondary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: secondary,
    border: '#cccccc',
  },
  dark: {
    primary: '#1c1d36', // card surfaces
    text: '#ffffff',
    background: '#0a0c1a',
    tint: secondary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: secondary,
    border: '#534c67',
  },
};

// React Navigation theme that matches the SCSS dark palette
export const NavigationDarkTheme: NavigationTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    primary: secondary,            // interactive elements (tint)
    background: '#0a0c1a',         // primary-dark
    card: '#1c1d36',               // primary
    text: '#ffffff',               // white
    border: '#534c67',             // primary-light
    notification: secondary,       // same as accent
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
