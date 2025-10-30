import {default as styled} from 'styled-components/native';

import type { DefaultTheme } from 'styled-components/native';
import {TextInput, TextInputProps} from "react-native";
import {useTheme} from "@react-navigation/native";

export const ThemedTextInput = (props:TextInputProps) => {
  const {colors} = useTheme();

  return <StyledTextInput placeholderTextColor={colors.text + '88'} {...props} />
}

const StyledTextInput: typeof TextInput = styled.TextInput`
  border-width: 0.5px;
  padding-horizontal: 10px;
  padding-vertical: 8px;
  border-radius: 6px;
  min-width: 120px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  background-color: transparent;
  height: 42px;
`;
