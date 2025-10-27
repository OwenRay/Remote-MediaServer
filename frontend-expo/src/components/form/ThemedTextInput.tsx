import styled from 'styled-components/native';

import type { DefaultTheme } from 'styled-components/native';
import {TextInput} from "react-native";

export const ThemedTextInput: typeof TextInput = styled.TextInput`
  border-width: 0.5px;
  padding-horizontal: 10px;
  padding-vertical: 8px;
  border-radius: 6px;
  min-width: 120px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;
