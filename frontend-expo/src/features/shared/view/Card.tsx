import { default as styled, DefaultTheme } from 'styled-components/native';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/src/features/shared/view/themed-text';

export const Card = styled.View`
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
`;

export const CardTitle = styled(ThemedText)`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const HelpText = styled(ThemedText)`
  font-size: 12px;
  opacity: 0.8;
`;

