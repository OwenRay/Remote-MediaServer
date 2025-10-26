/**
 * Theme color hook that derives from the navigation theme instead of OS color scheme.
 */
import { useTheme } from '@react-navigation/native';
import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const navTheme = useTheme();
  const scheme = navTheme.dark ? 'dark' : 'light';
  const colorFromProps = props[scheme];
  if (colorFromProps) return colorFromProps;
  return Colors[scheme][colorName];
}
